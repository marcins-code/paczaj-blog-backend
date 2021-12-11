import { Document } from 'mongodb';
import { PaginatedDocumentsTypes, PaginationData } from '../Interfaces/CustomTypes';

interface RepositoryInterface {
  getSingleDocumentById(id:string): Promise<Document | undefined>
  getPaginatedDocuments (paginationData: PaginationData): Promise<PaginatedDocumentsTypes | Document | undefined>
}

export default RepositoryInterface;
