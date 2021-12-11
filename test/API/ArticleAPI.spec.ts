import { Collection, MongoClient, ObjectId } from 'mongodb';
import { connectionOptions, dbName, uri } from '../../src/Utils/dbConnection';
import UserRepository from '../../src/Repository/UserRepository';
import ArticleTypeRepository from '../../src/Repository/ArticleTypeRepository';
import Authentication from '../../src/Repository/Authentication';
import ArticleCollectionSeeder from '../utils/ArticleCollectionSeeder';
import ArticleRepository from '../../src/Repository/ArticleRepository';
import CollectionHelper from '../utils/CollectionHelper';
// @ts-ignore
import request from 'supertest';
import app from '../../src/app';
import { errorsMessages } from '../../src/Validator/ErrorMessages';
import { validLanguages } from '../../src/Interfaces/Enums';

let connection: void | MongoClient;
let articlesCollection: Collection;
let articleTypeCollection: Collection;
let userCollection: Collection;
beforeAll(async () => {
  // connection
  connection = await MongoClient.connect(uri, connectionOptions);
  // injection db
  await UserRepository.injectDB(connection);
  await ArticleTypeRepository.injectDB(connection);
  await Authentication.injectDB(connection);
  await ArticleRepository.injectDB(connection);
  articlesCollection = connection.db(dbName).collection('articles');
  articleTypeCollection = connection.db(dbName).collection('articleTypes');
  userCollection = connection.db(dbName).collection('users');

  await ArticleCollectionSeeder.checkAndPrepareArticlesCollection(articlesCollection, articleTypeCollection, userCollection);
});

describe('Single article id by id', () => {
  describe('preview endpoint', () => {
    let someArticle: any;
    it('Should be 422 error without Accept-Language header', async () => {
      someArticle = await CollectionHelper.getSomeDocument(articlesCollection, 2);
      const result = await request(app)
        .get(`/article/${someArticle!._id.toString()}`);
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingLang);
    });
    it('Should be 422 error with incorrect language ', async () => {
      const incorrectLangs = ['de', 'fr', 'ru'];
      for (const incorrectLang of incorrectLangs) {
        const result = await request(app)
          .get(`/article/${someArticle!._id.toString()}`)
          .set('Accept-Language', incorrectLang);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.invalidLang);
      }
    });
    it('Should be 422 error with invalid id format', async () => {
      const invalidId = 'someStupidText';
      const result = await request(app)
        .get(`/article/${invalidId}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.invalidIdFormat);
    });
    it('Should be 404 error when id not exists in articleTypes collection', async () => {
      const result = await request(app)
        .get(`/article/${CollectionHelper.makeNotExistingId()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemNotFound);
    });
    it('Should be 404 error id exists in articleTypes collection but articleType is disabled', async () => {
      const disabledArticle = await articlesCollection.findOne({ isEnabled: false });
      const result = await request(app)
        .get(`/article/${disabledArticle!._id.toString()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemNotFound);
    });
    it('Should be status 200 and proper response object in polish language ', async () => {
      const creator = await userCollection.findOne({ _id: someArticle!.creator });
      const articleType = await articleTypeCollection.findOne({ _id: someArticle.articleTypeId });
      const result = await request(app)
        .get(`/article/${someArticle!._id.toString()}`)
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(200);
      expect(response.title).toEqual(someArticle!.titlePl);
      expect(response.seriePart).toEqual(someArticle!.seriePart);
      expect(response.content).toEqual(someArticle!.content.pl);
      expect(response.creator._id).toEqual(someArticle!.creator.toString());
      expect(response.creator._id).toEqual(creator!._id.toString());
      expect(response.creator.firstName).toEqual(creator!.firstName);
      expect(response.creator.lastName).toEqual(creator!.lastName);
      expect(response.articleType._id).toEqual(articleType!._id.toString());
      expect(response.articleType.name).toEqual(articleType!.name);
      expect(response.articleType.type).toEqual(articleType!.type);
      expect(response.articleType.icon).toEqual(articleType!.icon);
      expect(response.isEnabled).toBeUndefined();
    });
    it('Should be status 200 and proper response object in english language ', async () => {
      const creator = await userCollection.findOne({ _id: someArticle!.creator });
      const articleType = await articleTypeCollection.findOne({ _id: someArticle.articleTypeId });
      const result = await request(app)
        .get(`/article/${someArticle!._id.toString()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(200);
      expect(response.title).toEqual(someArticle!.titleEn);
      expect(response.seriePart).toEqual(someArticle!.seriePart);
      expect(response.content).toEqual(someArticle!.content.en);
      expect(response.creator._id).toEqual(someArticle!.creator.toString());
      expect(response.creator._id).toEqual(creator!._id.toString());
      expect(response.creator.firstName).toEqual(creator!.firstName);
      expect(response.creator.lastName).toEqual(creator!.lastName);
      expect(response.articleType._id).toEqual(articleType!._id.toString());
      expect(response.articleType.name).toEqual(articleType!.name);
      expect(response.articleType.type).toEqual(articleType!.type);
      expect(response.articleType.icon).toEqual(articleType!.icon);
      expect(response.isEnabled).toBeUndefined();
    });
  });
  describe('Admin endpoint', () => {
    let someArticle: any;
    let somUser: any;
    it('Should be 401 error when url contains \'admin\' and missing Authorization header', async () => {
      someArticle = await CollectionHelper.getSomeDocument(articlesCollection, 2);
      const result = await request(app)
        .get(`/admin/article/${someArticle!._id.toString()}`)
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(401);
      expect(response).toEqual(errorsMessages.missingAuthorization);
    });
    it('Should be 401 error with invalid jwtToken', async () => {
      const result = await request(app)
        .get(`/admin/article/${someArticle!._id.toString()}`)
        .set('Authorization', 'Bearer ' + CollectionHelper.makeInvalidToken())
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(401);
    });
    it('Should be 401 error with expired token', async () => {
      somUser = await CollectionHelper.getSomeDocument(userCollection, 14);
      const auth = new Authentication();
      const expiredLogin = await auth.login(somUser!.email, somUser!.firstName, '1ms');
      const result = await request(app)
        .get(`/admin/article/${someArticle!._id.toString()}`)
        .set('Authorization', 'Bearer ' + expiredLogin.jwtToken)
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(401);
    });
    it('Should be 200 status code and proper response with valid jwtToken', async () => {
      const creator = await userCollection.findOne({ _id: someArticle!.creator });
      const articleType = await articleTypeCollection.findOne({ _id: someArticle.articleTypeId });

      const auth = new Authentication();
      const userLogin = await auth.login(somUser!.email, somUser!.firstName);
      const result = await request(app)
        .get(`/admin/article/${someArticle!._id.toString()}`)
        .set('Authorization', 'Bearer ' + userLogin.jwtToken)
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(200);
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(200);
      expect(response.titlePl).toEqual(someArticle!.titlePl);
      expect(response.titleEn).toEqual(someArticle!.titleEn);
      expect(response.seriePart).toEqual(someArticle!.seriePart);
      expect(response.content).toEqual(someArticle!.content);
      expect(response.creator._id).toEqual(someArticle!.creator.toString());
      expect(response.creator._id).toEqual(creator!._id.toString());
      expect(response.creator.firstName).toEqual(creator!.firstName);
      expect(response.creator.lastName).toEqual(creator!.lastName);
      expect(response.articleType._id).toEqual(articleType!._id.toString());
      expect(response.articleType.name).toEqual(articleType!.name);
      expect(response.articleType.type).toEqual(articleType!.type);
      expect(response.articleType.icon).toEqual(articleType!.icon);
      expect(response.isEnabled).toEqual(someArticle!.isEnabled);
    });
  });
});

describe('GET paginated articles', () => {
  describe('Common errors handling', () => {
    it('Should be 422 error without Accept-Language header', async () => {
      const result = await request(app)
        .get('/article');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingLang);
    });
    it('Should be 422 error with incorrect language ', async () => {
      const incorrectLangs = ['de', 'fr', 'ru'];
      for (const incorrectLang of incorrectLangs) {
        const result = await request(app)
          .get('/article')
          .set('Accept-Language', incorrectLang);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.invalidLang);
      }
    });
    it('Should be 422 error without perPage variable in query ', async () => {
      const result = await request(app)
        .get('/article')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingPerPage);
    });
    it('Should be 422 error without page variable in query ', async () => {
      const result = await request(app)
        .get('/article?perPage=4')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingPage);
    });
    it('Should be 422 error when perPage variable is string ', async () => {
      const result = await request(app)
        .get('/article?perPage=string&page=2')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPerPage);
    });
    it('Should be 422 error when page variable is string ', async () => {
      const result = await request(app)
        .get('/article?perPage=33&page=string')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPage);
    });
    it('Should be 422 error when perPage variable is not integer ', async () => {
      const result = await request(app)
        .get('/article?perPage=2.6&page=2')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPerPage);
    });
    it('Should be 422 error when page variable is not integer ', async () => {
      const result = await request(app)
        .get('/article?perPage=33&page=5.7')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPage);
    });
    it('Should be 404 error when page is bigger than totalPages ', async () => {
      const result = await request(app)
        .get('/article?perPage=3&page=105')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemsNotFound);
    });
  });
  describe('Preview endpoint', () => {
    describe('Response validation', () => {
      let totalEnabledArticles: number;
      it('Should be only enabled documents in data array', async () => {
        totalEnabledArticles = await articlesCollection.countDocuments({ isEnabled: true });
        const result = await request(app)
          .get('/article?perPage=100&page=1')
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalEnabledArticles);
      });
      it('Should be proper response not on last page', async () => {
        const perPage = 10;
        const page = 2;
        const result = await request(app)
          .get(`/article?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(perPage);
        expect(response.currentPage).toEqual(page);
        expect(response.docsOnPage).toEqual(perPage);
        expect(response.totalDocs).toEqual(totalEnabledArticles);
        expect(response.totalPages).toEqual(Math.ceil(totalEnabledArticles / perPage));
      });
      it('Should be proper response on last page', async () => {
        const perPage = 8;
        const page = 4;
        const result = await request(app)
          .get(`/article?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalEnabledArticles - (perPage * (page - 1)));
        expect(response.currentPage).toEqual(page);
        expect(response.docsOnPage).toEqual(totalEnabledArticles - (perPage * (page - 1)));
        expect(response.totalDocs).toEqual(totalEnabledArticles);
        expect(response.totalPages).toEqual(Math.ceil(totalEnabledArticles / perPage));
      });
      it('Should be proper document in data array', async () => {
        const perPage = 8;
        const page = 4;
        for (const validLanguage of Object.keys(validLanguages)) {
          const result = await request(app)
            .get(`/article?perPage=${perPage}&page=${page}`)
            .set('Accept-Language', validLanguage);
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(200);
          expect(response.data.length).toEqual(totalEnabledArticles - (perPage * (page - 1)));
          expect(response.currentPage).toEqual(page);
          expect(response.docsOnPage).toEqual(totalEnabledArticles - (perPage * (page - 1)));
          expect(response.totalDocs).toEqual(totalEnabledArticles);
          expect(response.totalPages).toEqual(Math.ceil(totalEnabledArticles / perPage));
          const firstArticleInDataArray = await articlesCollection.findOne({ _id: new ObjectId(response.data[0]._id) });
          const creator = await userCollection.findOne({ _id: new ObjectId(response.data[0].creator._id) });
          const articleType = await articleTypeCollection.findOne({ _id: new ObjectId(response.data[0].articleType._id) });
          expect(response.data[0].seriePart).toEqual(firstArticleInDataArray!.seriePart);
          expect(response.data[0].isEnabled).toBeUndefined();
          if (validLanguage === 'pl') {
            expect(response.data[0].title).toEqual(firstArticleInDataArray!.titlePl);
          } else {
            expect(response.data[0].title).toEqual(firstArticleInDataArray!.titleEn);
          }
          expect(response.data[0].content).toEqual(firstArticleInDataArray!.content[validLanguage].substr(0, 250));
          expect(response.data[0].creator._id).toEqual(creator!._id.toString());
          expect(response.data[0].creator.firstName).toEqual(creator!.firstName);
          expect(response.data[0].creator.lastName).toEqual(creator!.lastName);
          expect(response.data[0].creator.password).toBeUndefined();
          expect(response.data[0].creator.roles).toBeUndefined();
          expect(response.data[0].articleType._id).toEqual(articleType!._id.toString());
          expect(response.data[0].articleType.name).toEqual(articleType!.name);
          expect(response.data[0].articleType.type).toEqual(articleType!.type);
          expect(response.data[0].articleType.icon).toEqual(articleType!.icon);
        }
      });
    });
  });
  describe('Admin endpoint', () => {
    let somUser: any;
    let perPage: number;
    let page: number;
    describe('Errors handling', () => {
      it('Should be 401 error when url contains \'admin\' and missing Authorization header', async () => {
        perPage = 5;
        page = 4;
        somUser = await CollectionHelper.getSomeDocument(userCollection, 23);
        const result = await request(app)
          .get(`/admin/article?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(401);
        expect(response).toEqual(errorsMessages.missingAuthorization);
      });
      it('Should be 401 error with invalid jwtToken', async () => {
        const result = await request(app)
          .get(`/admin/article?perPage=${perPage}&page=${page}`)
          .set('Authorization', 'Bearer ' + CollectionHelper.makeInvalidToken())
          .set('Accept-Language', 'pl');
        expect(result.status).toEqual(401);
      });
      it('Should be 401 error with expired token', async () => {
        const auth = new Authentication();
        const expiredLogin = await auth.login(somUser!.email, somUser!.firstName, '1ms');
        const result = await request(app)
          .get(`/admin/article?perPage=${perPage}&page=${page}`)
          .set('Authorization', 'Bearer ' + expiredLogin.jwtToken)
          .set('Accept-Language', 'pl');
        expect(result.status).toEqual(401);
      });
    });
    describe('Response validation', () => {
      let totalArticleDocuments: number;
      let someUserLogin: any;
      it('Should be enabled and disabled documents in data array', async () => {
        totalArticleDocuments = await articlesCollection.countDocuments();
        const auth = new Authentication();
        someUserLogin = await auth.login(somUser!.email, somUser!.firstName);
        const result = await request(app)
          .get('/admin/article?perPage=1000&page=1')
          .set('Authorization', 'Bearer ' + someUserLogin.jwtToken)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalArticleDocuments);
      });
      it('Should be proper document in data array', async () => {
        const perPage = 8;
        const page = 4;
        for (const validLanguage of Object.keys(validLanguages)) {
          const result = await request(app)
            .get(`/admin/article?perPage=${perPage}&page=${page}`)
            .set('Authorization', 'Bearer ' + someUserLogin.jwtToken)
            .set('Accept-Language', validLanguage);
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(200);
          expect(response.data.length).toEqual(totalArticleDocuments - (perPage * (page - 1)));
          expect(response.currentPage).toEqual(page);
          expect(response.docsOnPage).toEqual(totalArticleDocuments - (perPage * (page - 1)));
          expect(response.totalDocs).toEqual(totalArticleDocuments);
          expect(response.totalPages).toEqual(Math.ceil(totalArticleDocuments / perPage));
          const firstArticleInDataArray = await articlesCollection.findOne({ _id: new ObjectId(response.data[0]._id) });
          const creator = await userCollection.findOne({ _id: new ObjectId(response.data[0].creator._id) });
          const articleType = await articleTypeCollection.findOne({ _id: new ObjectId(response.data[0].articleType._id) });
          expect(response.data[0].seriePart).toEqual(firstArticleInDataArray!.seriePart);
          expect(typeof response.data[0].isEnabled).toEqual('boolean');
          if (validLanguage === 'pl') {
            expect(response.data[0].title).toEqual(firstArticleInDataArray!.titlePl);
          } else {
            expect(response.data[0].title).toEqual(firstArticleInDataArray!.titleEn);
          }
          expect(response.data[0].content).toEqual(firstArticleInDataArray!.content[validLanguage].substr(0, 250));
          expect(response.data[0].creator._id).toEqual(creator!._id.toString());
          expect(response.data[0].creator.firstName).toEqual(creator!.firstName);
          expect(response.data[0].creator.lastName).toEqual(creator!.lastName);
          expect(response.data[0].creator.password).toBeUndefined();
          expect(response.data[0].creator.roles).toBeUndefined();
          expect(response.data[0].articleType._id).toEqual(articleType!._id.toString());
          expect(response.data[0].articleType.name).toEqual(articleType!.name);
          expect(response.data[0].articleType.type).toEqual(articleType!.type);
          expect(response.data[0].articleType.icon).toEqual(articleType!.icon);
        }
      });
    });
  });
});
