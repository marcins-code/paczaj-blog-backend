import Encryption from '../Security/Encryption';
import { validateOrReject } from 'class-validator';
import InvalidInputException from '../Exceptions/InvalidInputException';
import {
  validateIsUniqueInCollectionParams,
  validLanguages
} from '../Interfaces/Enums';
import { Collection, ObjectId } from 'mongodb';
import { commonRegex } from './commonRegex';
import { errorsMessages } from './ErrorMessages';
// import { requestHeader } from '../Interfaces/CustomTypes';
// import request from 'supertest';
import { IncomingHttpHeaders } from 'http';
import UnauthorizedException from '../Exceptions/UnauthorizedException';
import { PaginationData, validateAdminRequestTypes } from '../Interfaces/CustomTypes';

class Validator {
    // @ts-ignore
    private encryption: Encryption;

    constructor () {
      this.encryption = new Encryption();
    }

    async validateEntity (obj: Object): Promise<any> {
      try {
        return await validateOrReject(obj);
      } catch (errors: any) {
        if (errors) {
          const [firstMessage]: string[] = Object.values(errors[0].constraints);
          throw new InvalidInputException(firstMessage);
        }
      }
    }

    validateEmail (email: string): void {
      if (!commonRegex.email.test(email)) {
        throw new InvalidInputException(errorsMessages.invalidEmailFormat);
      }
    }

    public async validateIsUniqueInCollection (
      collection: Collection,
      filter: Object,
      params: validateIsUniqueInCollectionParams,
      message: string,
      id: string = ''
    ): Promise<void> {
      if (params === 1) {
        filter = {
          ...filter,
          _id: { $ne: new ObjectId(id) }
        };
      }
      const docNo = await collection.countDocuments(filter);
      const isNotUnique = docNo > 0;
      if (isNotUnique) {
        throw new InvalidInputException(message);
      }
    }

    public validateLanguage (reqHeader: IncomingHttpHeaders) {
      const lang = reqHeader['accept-language'];
      if (!lang) throw new InvalidInputException(errorsMessages.missingLang);
      if (!Object.values(validLanguages).includes(lang)) {
        throw new InvalidInputException(errorsMessages.invalidLang);
      }

      return lang;
    }

    public validateIsValidObjectId (id: string) {
      if (!ObjectId.isValid(id)) throw new InvalidInputException(errorsMessages.invalidIdFormat);
      return id;
    }

    public validateAdminRequest (reqHeader: IncomingHttpHeaders, reqUrl:string): validateAdminRequestTypes {
      const isAdminRequest = /admin/.test(reqUrl);
      if (!isAdminRequest) return { isAuthorized: false };
      if (isAdminRequest && !reqHeader.authorization) throw new UnauthorizedException(errorsMessages.missingAuthorization);
      else {
        const jwtToken = reqHeader.authorization?.split(' ')[1];
        const decodedToken = this.encryption.verifyJwtToken(jwtToken!);
        return {
          isAuthorized: true,
          isAdmin: decodedToken.roles.some((role: string) => /ADMIN/.test(role)),
          isSuperAdmin: decodedToken.roles.some((role: string) => /SUPERADMIN/.test(role)),
          userId: decodedToken._id,
          roles: decodedToken.roles
        };
      }
    }

    public validateIsInteger (variable: number, message: string): void {
      if (!Number.isInteger(variable)) {
        throw new InvalidInputException(message);
      }
    }

    public validatePaginationData (reqQuery: any): PaginationData {
      if (!reqQuery.perPage) throw new InvalidInputException(errorsMessages.missingPerPage);
      if (!reqQuery.page) throw new InvalidInputException(errorsMessages.missingPage);
      // const page = parseInt(reqQuery.page);
      // const perPage = parseInt(reqQuery.perPage);

      if (!Number.isInteger(Number(reqQuery.page))) throw new InvalidInputException(errorsMessages.noIntegerPage);
      if (!Number.isInteger(Number(reqQuery.perPage))) throw new InvalidInputException(errorsMessages.noIntegerPerPage);
      return { perPage: parseInt(reqQuery.perPage), page: parseInt(reqQuery.page) };
    }
}

export default Validator;
