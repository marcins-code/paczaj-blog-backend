import { ObjectId } from 'mongodb';
import {
  IsDefined,
  IsIn,
  IsInt,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator';
import { errorsMessages } from '../Validator/ErrorMessages';

class ArticleEntity {
  _id?: ObjectId;

  @IsDefined({
    message: errorsMessages.polishTitleIsRequired
  })
  @MinLength(5, { message: errorsMessages.articleTitleTooShort })
  @MaxLength(255, { message: errorsMessages.articleTitleTooLong })
  titlePl: string | undefined;

  @MinLength(5, { message: errorsMessages.articleTitleTooShort })
  @MaxLength(255, { message: errorsMessages.articleTitleTooLong })
  titleEn: string | undefined;

  @IsDefined({
    message: errorsMessages.articleTypeIsRequired
  })
  @IsIn(['category', 'serie'], {
    message: errorsMessages.articleTypeValidTypes
  })
  articleType: string | undefined;

  @ValidateIf((o) => o.articleType === 'serie')
  @IsDefined({ message: errorsMessages.seriePartRequired })
  @IsInt({ message: errorsMessages.seriePartMustBeInt })
  seriePart?: number;

  @IsDefined({ message: errorsMessages.creatorIsRequired })
  creator?: ObjectId;

  @IsDefined({ message: errorsMessages.articleTypeIdIsRequired })
  articleTypeId: ObjectId | undefined;

  tags?: string[];
  content: { pl: string; en: string } | undefined;
  isEnabled: boolean = false;
  createdAt?: Date = new Date(Date.now());
  updatedAt: Date = new Date(Date.now());
}

export default ArticleEntity;
