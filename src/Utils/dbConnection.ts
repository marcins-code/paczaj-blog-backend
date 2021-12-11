import dotenv from 'dotenv';
dotenv.config();

export const port = process.env.NODE_ENV === 'docker' ? 8001 : process.env.APP_PORT;
//
const mongoHost = process.env.NODE_ENV === 'docker' ? 'mongo' : process.env.MONGO_HOST;
const mongoPort = 27018;
export const dbName =
    process.env.ENV === 'production'
      ? process.env.MONGO_DB
      : process.env.MONGO_TEST_DB;
export const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${mongoHost}:${mongoPort}/${dbName}?authSource=admin`;

export const connectionOptions = { wtimeoutMS: 2500, useNewUrlParser: true };
