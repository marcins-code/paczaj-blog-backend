import { Document, ObjectId } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';

export interface loginTypes {
    jwtToken: string;
    firstName: string;
    lastName: string;
    _id: string;
    avatar: string;
    roles: string[];
    expired: number;
}

export interface PaginatedDocumentsTypes extends Document{
    data: Document[];
    docsOnPage: number;
    totalDocs: number;
    totalPages: number;
    currentPage: number;
}

export interface customJwtPayload extends JwtPayload {
    _id: string;
    roles: string[];
}

export interface updateDocumentTypes extends Document {
    acknowledged: boolean;
    modifiedCount: number;
    upsertedId: any;
    upsertedCount: number;
    matchedCount: number;
}

export interface deleteDocumentTypes {
    acknowledged: boolean;
    deletedCount: number;
}

export interface insertDocumentTypes {
    acknowledged: boolean;
    insertedId: ObjectId;
}

// @ts-ignore
export interface requestHeader {
    accept: string;
    host: string;
    connection: string;
    'accept-language': string;
    'user-agent': string;
    'accept-encoding': string;
}

export interface validateAdminRequestTypes {
    isAuthorized: boolean;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    userId?: string;
    roles?: string[];
}

export interface PaginationData {
    perPage: number;
    page: number;
    filter?: string;
}
