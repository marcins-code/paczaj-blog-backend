import RepositoryInterface from './RepositoryInterface';
import { Document, MongoClient, Collection, ObjectId } from 'mongodb';
import { dbName } from '../Utils/dbConnection';
import InternalServerErrorException from '../Exceptions/InternalServerErrorException';
import NotFoundException from '../Exceptions/NotFoundException';
import { errorsMessages } from '../Validator/ErrorMessages';
import { PaginatedDocumentsTypes, PaginationData } from '../Interfaces/CustomTypes';

let usersCollection: Collection;

class UserRepository implements RepositoryInterface {
  private readonly _admin;
  private readonly _lang;
  constructor (lang: string, admin: boolean = false) {
    this._admin = admin;
    this._lang = lang;
  }

  static async injectDB (conn: MongoClient | void) {
    if (usersCollection) {
      return;
    }
    try {
      if (conn instanceof MongoClient) {
        usersCollection = await conn.db(dbName).collection('users');
      }
    } catch (err: any) {
      throw new InternalServerErrorException(errorsMessages.notConnectionToDb);
    }
  }

  public async getSingleDocumentById (id: string): Promise<Document> {
    const objId = new ObjectId(id);
    let queriedUser: Document;
    if (!this._admin) {
      queriedUser = await usersCollection
        .aggregate([
          {
            $match: {
              _id: objId,
              isEnabled: true
            }
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              avatar: 1,
              createdAt: 1,
              updatedAt: 1,
              aboutMe: `$aboutMe.${this._lang}`
            }
          }
        ])
        .toArray();
    } else {
      queriedUser = await usersCollection
        .aggregate([
          {
            $match: { _id: objId }
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              avatar: 1,
              createdAt: 1,
              updatedAt: 1,
              aboutMe: 1,
              isEnabled: 1,
              roles: 1
            }
          }
        ])
        .toArray();
    }
    if (queriedUser && !queriedUser.length) {
      throw new NotFoundException(errorsMessages.userNotFound);
    } else {
      return await queriedUser.shift();
    }
  }

  public async getPaginatedDocuments (
    paginationData: PaginationData
  ): Promise<PaginatedDocumentsTypes | Document| undefined> {
    let dataProjection;
    dataProjection = {
      firstName: 1,
      lastName: 1,
      email: 1,
      avatar: 1,
      aboutMe: `$aboutMe.${this._lang}`,
      createdAt: 1,
      updatedAt: 1
    };

    dataProjection = this._admin
      ? {
          ...dataProjection,
          roles: 1,
          isEnabled: 1
        }
      : dataProjection;
    const DataPipeline = [
      { $skip: (paginationData.page - 1) * paginationData.perPage },
      { $limit: paginationData.perPage },
      { $project: dataProjection }
    ];
    let pipeline: any;
    pipeline = [
      { $match: { isEnabled: true } },
      {
        $facet: {
          data: DataPipeline,
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

    const paginatedResult = await usersCollection.aggregate(pipeline).toArray();

    const { totalPages } = paginatedResult[0];
    if (paginationData.page > totalPages) {
      throw new NotFoundException(errorsMessages.itemsNotFound);
    }
    return paginatedResult.shift();
  }
}

export default UserRepository;
