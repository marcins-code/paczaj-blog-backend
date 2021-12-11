import RepositoryInterface from './RepositoryInterface';
import { Collection, Document, MongoClient, ObjectId } from 'mongodb';
import { dbName } from '../Utils/dbConnection';
import { creatorLookUp } from '../Utils/commonAggregation';
import NotFoundException from '../Exceptions/NotFoundException';
import { errorsMessages } from '../Validator/ErrorMessages';
import { PaginatedDocumentsTypes, PaginationData } from '../Interfaces/CustomTypes';

let glossaryCollection: Collection;
// @ts-ignore
let usersCollection: Collection;

class GlossaryRepository implements RepositoryInterface {
 private readonly _admin;
 private readonly _lang;
 constructor (lang: string, admin: boolean = false) {
   this._admin = admin;
   this._lang = lang;
 }

 static async injectDB (conn: MongoClient | void) {
   if (glossaryCollection) {
     return;
   }
   try {
     if (conn instanceof MongoClient) {
       glossaryCollection = conn.db(dbName).collection('glossary');
       usersCollection = conn.db(dbName).collection('users');
     }
   } catch (e: any) {
     console.error(`Unable to establish collection handles in userDAO: ${e}`);
   }
 }

 public async getSingleDocumentById (id: string): Promise<Document | undefined> {
   const isNotAdminMatch = { _id: new ObjectId(id), isEnabled: true };
   const istAdminMatch = { _id: new ObjectId(id) };
   const isNotAdminProject = {
     _id: 1,
     abbreviation: 1,
     phrase: 1,
     creator: { $arrayElemAt: ['$creator', 0] },
     explication: 1,
     updatedAt: 1,
     createdAt: 1,
     explanation: `$explanation.${this._lang}`
   };
   const isAdminProject = {
     ...isNotAdminProject,
     isEnabled: 1,
     explanation: 1
   };
   const pipeline = [
     {
       $match: this._admin ? istAdminMatch : isNotAdminMatch
     },
     creatorLookUp,
     {
       $project: this._admin ? isAdminProject : isNotAdminProject
     }
   ];

   const glossary = await glossaryCollection
     .aggregate(pipeline)
     .toArray();
   if (!glossary.length) {
     throw new NotFoundException(errorsMessages.itemNotFound);
   }
   return glossary.shift();
 }

 // getPaginatedDocuments (paginationData: PaginationData): Promise<PaginatedDocumentsTypes | Document | undefined> {
 //   return Promise.resolve(undefined);
 // }

 public async getPaginatedDocuments (paginationData: PaginationData): Promise<PaginatedDocumentsTypes | Document | undefined> {
   const dataWithoutJwtProjection: Object = {
     abbreviation: 1,
     phrase: 1,
     explication: 1,
     createdAt: 1,
     updatedAt: 1,
     creator: { $arrayElemAt: ['$creator', 0] },
     explanation: { $substr: [`$explanation.${this._lang}`, 0, 250] }
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
   const glossary = await glossaryCollection
     .aggregate(pipeline)
     .toArray();
   const { totalPages } = glossary[0];
   if (paginationData.page > totalPages) {
     throw new NotFoundException(errorsMessages.itemsNotFound);
   }

   return glossary.shift();
 }
}
export default GlossaryRepository;
