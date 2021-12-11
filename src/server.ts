import app from './app';
import { MongoClient } from 'mongodb';
import { connectionOptions, uri, port } from './Utils/dbConnection';
import dotenv from 'dotenv';
import Authentication from './Repository/Authentication';
import UserRepository from './Repository/UserRepository';
import ArticleTypeRepository from './Repository/ArticleTypeRepository';
import ArticleRepository from './Repository/ArticleRepository';
import GlossaryRepository from './Repository/GlossaryRepository';
dotenv.config();

MongoClient.connect(uri, connectionOptions)
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async (client) => {
    await UserRepository.injectDB(client);
    await Authentication.injectDB(client);
    await ArticleTypeRepository.injectDB(client);
    await ArticleRepository.injectDB(client);
    await GlossaryRepository.injectDB(client);
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  });
