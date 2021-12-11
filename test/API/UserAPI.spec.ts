// @ts-ignore
import request from 'supertest';
import app from '../../src/app';
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { connectionOptions, dbName, uri } from '../../src/Utils/dbConnection';
import Authentication from '../../src/Repository/Authentication';
import UsersCollectionSeeder from '../utils/UsersCollectionSeeder';
import UserRepository from '../../src/Repository/UserRepository';
import CollectionHelper from '../utils/CollectionHelper';
import { errorsMessages } from '../../src/Validator/ErrorMessages';
import { validLanguages } from '../../src/Interfaces/Enums';
let connection: void | MongoClient;
let userCollection: Collection;

beforeAll(async () => {
  // connection
  connection = await MongoClient.connect(uri, connectionOptions);
  // injection db
  await UserRepository.injectDB(connection);
  await Authentication.injectDB(connection);

  // collections
  userCollection = await connection.db(dbName).collection('users');
  await UsersCollectionSeeder.checkAndPrepareUsersCollection(userCollection);
}, 15000);
describe('GET single user by id', () => {
  describe('preview endpoint', () => {
    let somUser: any;
    it('Should be 422 error without Accept-Language header', async () => {
      somUser = await CollectionHelper.getSomeDocument(userCollection, 22);
      const result = await request(app)
        .get(`/user/${somUser!._id.toString()}`);
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingLang);
    });
    it('Should be 422 error with incorrect language ', async () => {
      const incorrectLangs = ['de', 'fr', 'ru'];
      for (const incorrectLang of incorrectLangs) {
        const result = await request(app)
          .get(`/user/${somUser!._id.toString()}`)
          .set('Accept-Language', incorrectLang);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.invalidLang);
      }
    });
    it('Should be 422 error with invalid id format', async () => {
      const invalidId = 'someStupidText';
      const result = await request(app)
        .get(`/user/${invalidId}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.invalidIdFormat);
    });
    it('Should be 404 error when id not exists in user collection', async () => {
      const result = await request(app)
        .get(`/user/${CollectionHelper.makeNotExistingId()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.userNotFound);
    });
    it('Should be 404 error id exists in user collection but user is disabled', async () => {
      const disabledUser = await userCollection.findOne({ isEnabled: false });
      const result = await request(app)
        .get(`/user/${disabledUser!._id.toString()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.userNotFound);
    });
    it('Should be status 200 and proper response object ', async () => {
      for (const validLanguage of Object.keys(validLanguages)) {
        const result = await request(app)
          .get(`/user/${somUser!._id.toString()}`)
          .set('Accept-Language', validLanguage);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response._id).toEqual(somUser!._id.toString());
        expect(response.firstName).toEqual(somUser!.firstName);
        expect(response.lastName).toEqual(somUser!.lastName);
        expect(response.email).toEqual(somUser!.email);
        expect(response.avatar).toEqual(somUser!.avatar);
        expect(response.aboutMe).toEqual(somUser!.aboutMe[validLanguage]);
      }
    });
  });
  describe('Admin endpoint', () => {
    let somUser: any;
    it('Should be 401 error when url contains \'admin\' and missing Authorization header', async () => {
      somUser = await CollectionHelper.getSomeDocument(userCollection, 23);
      const result = await request(app)
        .get(`/admin/user/${somUser!._id.toString()}`)
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(401);
      expect(response).toEqual(errorsMessages.missingAuthorization);
    });
    it('Should be 401 error with invalid jwtToken', async () => {
      const result = await request(app)
        .get(`/admin/user/${somUser!._id.toString()}`)
        .set('Authorization', 'Bearer ' + CollectionHelper.makeInvalidToken())
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(401);
    });
    it('Should be 401 error with expired token', async () => {
      const auth = new Authentication();
      const expiredLogin = await auth.login(somUser!.email, somUser!.firstName, '1ms');
      const result = await request(app)
        .get(`/admin/user/${somUser!._id.toString()}`)
        .set('Authorization', 'Bearer ' + expiredLogin.jwtToken)
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(401);
    });
    it('Should be 200 status code and proper response with valid jwtToken', async () => {
      const auth = new Authentication();
      const userLogin = await auth.login(somUser!.email, somUser!.firstName);
      const result = await request(app)
        .get(`/admin/user/${somUser!._id.toString()}`)
        .set('Authorization', 'Bearer ' + userLogin.jwtToken)
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(200);
      const response = JSON.parse(result.text);
      expect(response.firstName).toEqual(somUser!.firstName);
      expect(response.lastName).toEqual(somUser!.lastName);
      expect(response.email).toEqual(somUser!.email);
      expect(response.avatar).toEqual(somUser!.avatar);
      expect(response.isEnabled).toEqual(somUser!.isEnabled);
      expect(response.roles).toEqual(somUser!.roles);
      expect(response.aboutMe).toEqual(somUser!.aboutMe);
      expect(response._id).toEqual(somUser!._id.toString());
    });
  });
});

describe('GET paginated users', () => {
  describe('Common errors handling', () => {
    it('Should be 422 error without Accept-Language header', async () => {
      const result = await request(app)
        .get('/user');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingLang);
    });
    it('Should be 422 error with incorrect language ', async () => {
      const incorrectLangs = ['de', 'fr', 'ru'];
      for (const incorrectLang of incorrectLangs) {
        const result = await request(app)
          .get('/user')
          .set('Accept-Language', incorrectLang);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.invalidLang);
      }
    });
    it('Should be 422 error without perPage variable in query ', async () => {
      const result = await request(app)
        .get('/user')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingPerPage);
    });
    it('Should be 422 error without page variable in query ', async () => {
      const result = await request(app)
        .get('/user?perPage=4')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingPage);
    });
    it('Should be 422 error when perPage variable is string ', async () => {
      const result = await request(app)
        .get('/user?perPage=string&page=2')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPerPage);
    });
    it('Should be 422 error when page variable is string ', async () => {
      const result = await request(app)
        .get('/user?perPage=33&page=string')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPage);
    });
    it('Should be 422 error when perPage variable is not integer ', async () => {
      const result = await request(app)
        .get('/user?perPage=2.6&page=2')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPerPage);
    });
    it('Should be 422 error when page variable is not integer ', async () => {
      const result = await request(app)
        .get('/user?perPage=33&page=5.7')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPage);
    });
    it('Should be 404 error when page is bigger than totalPages ', async () => {
      const result = await request(app)
        .get('/user?perPage=3&page=105')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemsNotFound);
    });
  });
  describe('preview endpoint', () => {
    describe('Response validation', () => {
      let totalEnabledUsers: number;
      it('Should be only enabled documents in data array', async () => {
        totalEnabledUsers = await userCollection.countDocuments({ isEnabled: true });
        const result = await request(app)
          .get('/user?perPage=100&page=1')
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalEnabledUsers);
      });
      it('Should be proper response not on last page', async () => {
        const perPage = 10;
        const page = 2;
        const result = await request(app)
          .get(`/user?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(perPage);
        expect(response.currentPage).toEqual(page);
        expect(response.docsOnPage).toEqual(perPage);
        expect(response.totalDocs).toEqual(totalEnabledUsers);
        expect(response.totalPages).toEqual(Math.ceil(totalEnabledUsers / perPage));
      });
      it('Should be proper response on last page', async () => {
        const perPage = 8;
        const page = 4;
        const result = await request(app)
          .get(`/user?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalEnabledUsers - (perPage * (page - 1)));
        expect(response.currentPage).toEqual(page);
        expect(response.docsOnPage).toEqual(totalEnabledUsers - (perPage * (page - 1)));
        expect(response.totalDocs).toEqual(totalEnabledUsers);
        expect(response.totalPages).toEqual(Math.ceil(totalEnabledUsers / perPage));
      });
      it('Should be proper document in data array', async () => {
        const perPage = 5;
        const page = 6;
        for (const validLanguage of Object.keys(validLanguages)) {
          const result = await request(app)
            .get(`/user?perPage=${perPage}&page=${page}`)
            .set('Accept-Language', validLanguage);
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(200);
          expect(response.data.length).toEqual(totalEnabledUsers - (perPage * (page - 1)));
          expect(response.currentPage).toEqual(page);
          expect(response.docsOnPage).toEqual(totalEnabledUsers - (perPage * (page - 1)));
          expect(response.totalDocs).toEqual(totalEnabledUsers);
          expect(response.totalPages).toEqual(Math.ceil(totalEnabledUsers / perPage));
          const firstUserInDataArray = await userCollection.findOne({ _id: new ObjectId(response.data[0]._id) });
          expect(response.data[0]._id).toEqual(firstUserInDataArray!._id.toString());
          expect(response.data[0].firstName).toEqual(firstUserInDataArray!.firstName);
          expect(response.data[0].lastName).toEqual(firstUserInDataArray!.lastName);
          expect(response.data[0].email).toEqual(firstUserInDataArray!.email);
          expect(response.data[0].avatar).toEqual(firstUserInDataArray!.avatar);
          expect(response.data[0].aboutMe).toEqual(firstUserInDataArray!.aboutMe[validLanguage]);
          expect(response.data[0].isEnabled).toBeUndefined();
          expect(response.data[0].roles).toBeUndefined();
          expect(response.data[0].password).toBeUndefined();
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
        page = 6;
        somUser = await CollectionHelper.getSomeDocument(userCollection, 23);
        const result = await request(app)
          .get(`/admin/user?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(401);
        expect(response).toEqual(errorsMessages.missingAuthorization);
      });
      it('Should be 401 error with invalid jwtToken', async () => {
        const result = await request(app)
          .get(`/admin/user?perPage=${perPage}&page=${page}`)
          .set('Authorization', 'Bearer ' + CollectionHelper.makeInvalidToken())
          .set('Accept-Language', 'pl');
        expect(result.status).toEqual(401);
      });
      it('Should be 401 error with expired token', async () => {
        const auth = new Authentication();
        const expiredLogin = await auth.login(somUser!.email, somUser!.firstName, '1ms');
        const result = await request(app)
          .get(`/admin/user?perPage=${perPage}&page=${page}`)
          .set('Authorization', 'Bearer ' + expiredLogin.jwtToken)
          .set('Accept-Language', 'pl');
        expect(result.status).toEqual(401);
      });
    });
    describe('Response validation', () => {
      let totalUsersDocuments: number;
      let someUserLogin: any;
      it('Should be enabled and disabled documents in data array', async () => {
        totalUsersDocuments = await userCollection.countDocuments();
        const auth = new Authentication();
        someUserLogin = await auth.login(somUser!.email, somUser!.firstName);
        const result = await request(app)
          .get('/admin/user?perPage=1000&page=1')
          .set('Authorization', 'Bearer ' + someUserLogin.jwtToken)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalUsersDocuments);
      });
      it('Should be proper response document in data array', async () => {
        const perPage = 4;
        const page = 6;
        for (const validLanguage of Object.keys(validLanguages)) {
          const result = await request(app)
            .get(`/admin/user?perPage=${perPage}&page=${page}`)
            .set('Authorization', 'Bearer ' + someUserLogin.jwtToken)
            .set('Accept-Language', validLanguage);
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(200);
          expect(response.data.length).toEqual(perPage);
          expect(response.currentPage).toEqual(page);
          expect(response.docsOnPage).toEqual(perPage);
          expect(response.totalDocs).toEqual(totalUsersDocuments);
          expect(response.totalPages).toEqual(Math.ceil(totalUsersDocuments / perPage));
          const firstUserInDataArray = await userCollection.findOne({ _id: new ObjectId(response.data[0]._id) });
          expect(response.data[0]._id).toEqual(firstUserInDataArray!._id.toString());
          expect(response.data[0].firstName).toEqual(firstUserInDataArray!.firstName);
          expect(response.data[0].lastName).toEqual(firstUserInDataArray!.lastName);
          expect(response.data[0].email).toEqual(firstUserInDataArray!.email);
          expect(response.data[0].avatar).toEqual(firstUserInDataArray!.avatar);
          expect(response.data[0].aboutMe).toEqual(firstUserInDataArray!.aboutMe[validLanguage]);
          expect(response.data[0].isEnabled).toEqual(firstUserInDataArray!.isEnabled);
          expect(response.data[0].roles).toEqual(firstUserInDataArray!.roles);
          expect(response.data[0].password).toBeUndefined();
        }
      });
    });
  });
});
