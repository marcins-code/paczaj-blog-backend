import RepositoryInterface from './RepositoryInterface';
import { Collection, MongoClient, ObjectId, Document } from 'mongodb';
import { dbName } from '../Utils/dbConnection';
import { creatorLookUp } from '../Utils/commonAggregation';
import NotFoundException from '../Exceptions/NotFoundException';
import { errorsMessages } from '../Validator/ErrorMessages';
import { PaginatedDocumentsTypes, PaginationData } from '../Interfaces/CustomTypes';

let articleCollection: Collection;
// @ts-ignore
let usersCollection: Collection;

class ArticleRepository implements RepositoryInterface {
    private readonly _admin;
    private readonly _lang;
    constructor (lang: string, admin: boolean = false) {
      this._admin = admin;
      this._lang = lang;
    }

    private _articleTypeLookUp:Object = {
      $lookup: {
        from: 'articleTypes',
        let: { id: '$articleTypeId' },
        pipeline: [
          {
            $match: { $expr: { $eq: ['$_id', '$$id'] } }
          },
          {
            $project: {
              name: 1,
              type: 1,
              icon: 1,
              // @ts-ignore
              description: `$description.${this._lang}`,
              _id: 1
            }
          }
        ],
        as: 'articleType'
      }
    };

    static async injectDB (conn: MongoClient | void) {
      if (articleCollection) {
        return;
      }
      try {
        if (conn instanceof MongoClient) {
          articleCollection = conn.db(dbName).collection('articles');
          usersCollection = conn.db(dbName).collection('users');
        }
      } catch (e: any) {
        console.error(`Unable to establish collection handles in DAO: ${e}`);
      }
    }

    public async getSingleDocumentById (id: string): Promise<Document> {
      const objId = new ObjectId(id);
      let queriedArticle: Document;
      if (!this._admin) {
        queriedArticle = await articleCollection
          .aggregate([
            {
              $match: {
                _id: objId,
                isEnabled: true
              }
            },
            creatorLookUp,
            this._articleTypeLookUp,
            {
              $project: {
                _id: 1,
                title: { $cond: { if: this._lang === 'pl', then: '$titlePl', else: '$titleEn' } },
                articleType: { $arrayElemAt: ['$articleType', 0] },
                seriePart: 1,
                createdAt: 1,
                updatedAt: 1,
                creator: { $arrayElemAt: ['$creator', 0] },
                content: `$content.${this._lang}`
              }
            }
          ])
          .toArray();
      } else {
        queriedArticle = await articleCollection
          .aggregate([
            {
              $match: { _id: objId }
            },
            creatorLookUp,
            this._articleTypeLookUp,
            {
              $project: {
                titlePl: 1,
                titleEn: 1,
                seriePart: 1,
                createdAt: 1,
                updatedAt: 1,
                content: 1,
                isEnabled: 1,
                articleType: { $arrayElemAt: ['$articleType', 0] },
                creator: { $arrayElemAt: ['$creator', 0] }
              }
            }
          ])
          .toArray();
      }
      if (queriedArticle && !queriedArticle.length) {
        throw new NotFoundException(errorsMessages.itemNotFound);
      } else {
        return queriedArticle.shift();
      }
    }

    public async getPaginatedDocuments (
      paginationData: PaginationData
    ): Promise<PaginatedDocumentsTypes | Document| undefined> {
      const dataWithoutJwtProjection: Object = {
        _id: 1,
        title: { $cond: { if: this._lang === 'pl', then: '$titlePl', else: '$titleEn' } },
        articleType: { $arrayElemAt: ['$articleType', 0] },
        seriePart: 1,
        createdAt: 1,
        updatedAt: 1,
        creator: { $arrayElemAt: ['$creator', 0] },
        content: { $substr: [`$content.${this._lang}`, 0, 250] }
      };
      const dataProjection = !this._admin
        ? dataWithoutJwtProjection
        : {
            ...dataWithoutJwtProjection,
            isEnabled: 1

          };
      let pipeline;
      pipeline = [
        { $match: { isEnabled: true } },
        {
          $facet: {
            data: [
              { $skip: (paginationData.page - 1) * paginationData.perPage },
              { $limit: paginationData.perPage },
              creatorLookUp,
              this._articleTypeLookUp,
              { $project: dataProjection }
            ],
            totalItems: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 }
                }
              }
            ]
          }
        },
        {
          $project: {
            data: 1,
            docsOnPage: { $size: '$data' },
            totalDocs: { $arrayElemAt: ['$totalItems.count', 0] },
            totalPages: {
              $ceil: {
                $divide: [{ $arrayElemAt: ['$totalItems.count', 0] }, paginationData.perPage]
              }
            }
          }
        },
        { $addFields: { currentPage: paginationData.page } }
      ];

      pipeline = this._admin ? pipeline.slice(1) : pipeline;
      const articleTypes = await articleCollection
        .aggregate(pipeline)
        .toArray();
      const { totalPages } = articleTypes[0];
      if (paginationData.page > totalPages) {
        throw new NotFoundException(errorsMessages.itemsNotFound);
      }

      return articleTypes.shift();
    }
}

export default ArticleRepository;
