import { Collection, Document, MongoClient } from 'mongodb';
import { dbName } from '../Utils/dbConnection';
import { Request } from 'express';
import UserEntity from '../Entity/UserEntity';
import { validateIsUniqueInCollectionParams } from '../Interfaces/Enums';
import { errorsMessages } from '../Validator/ErrorMessages';
import Encryption from '../Security/Encryption';
import Validator from '../Validator/Validator';
import { insertDocumentTypes, loginTypes } from '../Interfaces/CustomTypes';
import UnauthorizedException from '../Exceptions/UnauthorizedException';

let usersCollection: Collection;

class Authentication {
  private _encryption: Encryption;
  private _validator: Validator;
  constructor () {
    this._encryption = new Encryption();
    this._validator = new Validator();
  }

  static async injectDB (conn: MongoClient | void) {
    if (usersCollection) {
      return;
    }
    try {
      if (conn instanceof MongoClient) {
        usersCollection = await conn.db(dbName).collection('users');
      }
    } catch (e: any) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`);
    }
  }

  public async signUp (request: Request): Promise<insertDocumentTypes> {
    const newUser = new UserEntity(
      request.body.firstName,
      request.body.lastName,
      request.body.email,
      request.body.password,
      request.body.isEnabled,
      request.body.avatar,
      request.body.roles,
      request.body.aboutMe
    );
    await this._validator.validateEntity(newUser);
    newUser.password = await this._encryption.hashPassword(newUser.password!);
    newUser.createdAt = new Date(Date.now());
    await this._validator.validateIsUniqueInCollection(
      usersCollection,
      { email: request.body.email },
      validateIsUniqueInCollectionParams.INSERT,
      errorsMessages.emailExists
    );
    return await usersCollection.insertOne({
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      isEnabled: newUser.isEnabled,
      avatar: newUser.avatar,
      roles: newUser.roles,
      aboutMe: newUser.aboutMe,
      createdAt: newUser.createdAt
    });
  }

  private static async _getUserByEmail (
    email: string
  ): Promise<Document | null> {
    return await usersCollection.findOne(
      { email: email },
      {
        projection: {
          password: 1,
          id: 1,
          roles: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1
        }
      }
    );
  }

  public async login (
    email: string,
    plainPassword: string,
    tokenExpiration: string = '1h'
  ): Promise<loginTypes> {
    this._validator.validateEmail(email);

    const user: Document | null = await Authentication._getUserByEmail(
      email
    );
    if (!user) {
      throw new UnauthorizedException(errorsMessages.incorrectEmail);
    }

    const { password, _id, roles, firstName, lastName, avatar } = user;
    await this._encryption.comparePassword(plainPassword, password);
    const jwtToken = this._encryption.signJwtToken(
      {
        _id,
        roles
      },
      tokenExpiration
    );
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: { lastJwtToken: jwtToken, dateTime: new Date(Date.now()) }
        }
      }
    );
    const expired = new Date(Date.now()).getTime() + 60 * 1000 * 60;
    return {
      jwtToken,
      firstName,
      lastName,
      avatar,
      roles,
      expired,
      _id: _id.toString()
    };
  }
}

export default Authentication;
