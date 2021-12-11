import { ObjectId } from 'mongodb';
import { errorsMessages } from '../Validator/ErrorMessages';
import {
  IsIn,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsDefined
} from 'class-validator';

class ArticleTypeEntity {
  _id?: ObjectId;

  @IsDefined({
    message: errorsMessages.articleTypeNameRequired
  })
  @MinLength(2, {
    message: errorsMessages.articleTypeNameTooShort
  })
  @MaxLength(20, {
    message: errorsMessages.articleTypeNameTooLong
  })
  name: string | undefined;

  @IsDefined({
    message: errorsMessages.articleTypeTypeRequired
  })
  @IsIn(['category', 'serie'], {
    message: errorsMessages.articleTypeValidTypes
  })
  type: string | undefined;

  @IsNotEmpty({
    message: errorsMessages.articleTypeIconRequired
  })
  icon: string | undefined;

  @IsNotEmpty({
    message: errorsMessages.creatorIsRequired
  })
  creator?: ObjectId;

  isEnabled: boolean = false;
  description: { pl: string; en: string } | undefined;
  createdAt?: Date = new Date(Date.now());
  updatedAt?: Date = new Date(Date.now());
}

export default ArticleTypeEntity;
