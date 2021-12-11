import RepositoryInterface from './RepositoryInterface';
import { Collection, Document, MongoClient, ObjectId } from 'mongodb';
import { dbName } from '../Utils/dbConnection';
import { creatorLookUp } from '../Utils/commonAggregation';
import NotFoundException from '../Exceptions/NotFoundException';
import { errorsMessages } from '../Validator/ErrorMessages';
import { PaginatedDocumentsTypes, PaginationData } from '../Interfaces/CustomTypes';

let articleTypesCollection: Collection;
// @ts-ignore
let usersCollection: Collection;

class ArticleTypeRepository implements RepositoryInterface {
    private readonly _admin;
    private readonly _lang;
    constructor (lang: string, admin: boolean = false) {
      this._admin = admin;
      this._lang = lang;
    }

    static async injectDB (conn: MongoClient | void) {
      if (articleTypesCollection) {
        return;
      }
      try {
        if (conn instanceof MongoClient) {
          articleTypesCollection = conn.db(dbName).collection('articleTypes');
          usersCollection = conn.db(dbName).collection('users');
        }
      } catch (e: any) {
        console.error(`Unable to establish collection handles in userDAO: ${e}`);
      }
    }

    public async getSingleDocumentById (id: string): Promise<Document| undefined> {
      const isNotAdminMatch = { _id: new ObjectId(id), isEnabled: true };
      const isAdminMatch = { _id: new ObjectId(id) };
      const isNotAdminProject = {
        name: 1,
        type: 1,
        icon: 1,
        creator: { $arrayElemAt: ['$creator', 0] },
        createdAt: 1,
        updatedAt: 1,
        description: `$description.${this._lang}`
      };
      const isAdminProject = {
        ...isNotAdminProject,
        isEnabled: 1,
        description: 1
      };
      const pipeline = [
        {
          $match: this._admin ? isAdminMatch : isNotAdminMatch
        },
        creatorLookUp,
        {
          $project: this._admin ? isAdminProject : isNotAdminProject
        }
      ];

      const articleType = await articleTypesCollection
        .aggregate(pipeline)
        .toArray();
      if (!articleType.length) {
        throw new NotFoundException(errorsMessages.articleTypeNotFound);
      }
      return articleType.shift();
    }

    public async getPaginatedDocuments (paginationData: PaginationData): Promise<PaginatedDocumentsTypes | Document | undefined> {
      const dataWithoutJwtProjection: Object = {
        name: 1,
        type: 1,
        icon: 1,
        seriePart: 1,
        createdAt: 1,
        updatedAt: 1,
        // creator: '$creator',
        creator: { $arrayElemAt: ['$creator', 0] },
        description: `$description.${this._lang}`
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
      const articleTypes = await articleTypesCollection
        .aggregate(pipeline)
        .toArray();
      const { totalPages } = articleTypes[0];
      if (paginationData.page > totalPages) {
        throw new NotFoundException(errorsMessages.itemsNotFound);
      }

      return articleTypes.shift();
    }
}
export default ArticleTypeRepository;
