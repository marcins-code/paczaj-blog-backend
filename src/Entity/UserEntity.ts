import { IsDefined, Matches, MaxLength, MinLength } from 'class-validator';
import { commonRegex } from '../Validator/commonRegex';
import { ObjectId } from 'mongodb';
import { errorsMessages } from '../Validator/ErrorMessages';

interface translatedFields {
    pl: string;
    en: string;
}

class UserEntity {
     _id?: ObjectId;

    @IsDefined({
      message: errorsMessages.firstNameIsRequired
    })
    @MinLength(2, {
      message: errorsMessages.firstNameTooShort
    })
    @MaxLength(50, {
      message: errorsMessages.firstNameTooLong
    })
    @Matches(commonRegex.names, {
      message: errorsMessages.firstNameNotMatch
    })
    private _firstName: string;

    @IsDefined({
      message: errorsMessages.lastNameIsRequired
    })
    @MinLength(2, {
      message: errorsMessages.lastNameTooShort
    })
    @MaxLength(50, {
      message: errorsMessages.lastNameTooLong
    })
    @Matches(commonRegex.names, {
      message: errorsMessages.lastNameNotMatch
    })
    private _lastName: string;

    @IsDefined({ message: errorsMessages.emailIsRequired })
    @MaxLength(255, {
      message: errorsMessages.emailTooLong
    })
    @Matches(commonRegex.email, {
      message: errorsMessages.invalidEmailFormat
    }) private _email: string;

    @IsDefined({ message: errorsMessages.passwordIsRequired })
    @Matches(commonRegex.password, {
      message: errorsMessages.passwordNotMatch
    }) private _password: string;

    private _isEnabled: boolean = false;
    private _avatar: string | undefined;
    private _roles: string[] = ['ROLE_USER'];
    private _aboutMe: translatedFields;
    createdAt?: Date = new Date(Date.now());
    updatedAt: Date = new Date(Date.now());

    constructor (firstName: string, lastName: string, email: string, password: string, isEnabled: boolean, avatar: string, roles: string[], aboutMe: translatedFields) {
      this._firstName = firstName;
      this._lastName = lastName;
      this._email = email;
      this._password = password;
      this._isEnabled = isEnabled;
      this._avatar = avatar;
      this._roles = roles;
      this._aboutMe = aboutMe;
    }

    get firstName (): string {
      return this._firstName;
    }

    set firstName (value: string) {
      this._firstName = value;
    }

    get lastName (): string {
      return this._lastName;
    }

    set lastName (value: string) {
      this._lastName = value;
    }

    get email (): string {
      return this._email;
    }

    set email (value: string) {
      this._email = value;
    }

    get password (): string {
      return this._password;
    }

    set password (value: string) {
      this._password = value;
    }

    get aboutMe (): translatedFields {
      return this._aboutMe;
    }

    set aboutMe (value: translatedFields) {
      this._aboutMe = value;
    }

    get roles (): string[] {
      return this._roles;
    }

    set roles (value: string[]) {
      this._roles = value;
    }

    get avatar (): string | undefined {
      return this._avatar;
    }

    set avatar (value: string | undefined) {
      this._avatar = value;
    }

    get isEnabled (): boolean {
      return this._isEnabled;
    }

    set isEnabled (value: boolean) {
      this._isEnabled = value;
    }
}

export default UserEntity;
