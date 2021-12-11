import { Collection, MongoClient, ObjectId } from 'mongodb';
import { connectionOptions, dbName, uri } from '../../src/Utils/dbConnection';
import UserRepository from '../../src/Repository/UserRepository';
import Authentication from '../../src/Repository/Authentication';
import GlossaryCollectionSeeder from '../utils/GlossaryCollectionSeeder';
import GlossaryRepository from '../../src/Repository/GlossaryRepository';
import CollectionHelper from '../utils/CollectionHelper';
// @ts-ignore
import request from 'supertest';
import app from '../../src/app';
import { errorsMessages } from '../../src/Validator/ErrorMessages';
import { validLanguages } from '../../src/Interfaces/Enums';

let connection: void | MongoClient;
let glossaryCollection: Collection;
let userCollection: Collection;
beforeAll(async () => {
  // connection
  connection = await MongoClient.connect(uri, connectionOptions);
  // injection db
  await UserRepository.injectDB(connection);
  await GlossaryRepository.injectDB(connection);
  await Authentication.injectDB(connection);
  glossaryCollection = connection.db(dbName).collection('glossary');
  userCollection = connection.db(dbName).collection('users');
  await GlossaryCollectionSeeder.checkAndPrepareGlossaryCollection(glossaryCollection, userCollection);
});

describe('Single glossary id by id', () => {
  describe('preview endpoint', () => {
    let someGlossary: any;
    it('Should be 422 error without Accept-Language header', async () => {
      someGlossary = await CollectionHelper.getSomeDocument(glossaryCollection, 2);
      const result = await request(app)
        .get(`/glossary/${someGlossary!._id.toString()}`);
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingLang);
    });
    it('Should be 422 error with incorrect language ', async () => {
      const incorrectLangs = ['de', 'fr', 'ru'];
      for (const incorrectLang of incorrectLangs) {
        const result = await request(app)
          .get(`/glossary/${someGlossary!._id.toString()}`)
          .set('Accept-Language', incorrectLang);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.invalidLang);
      }
    });
    it('Should be 422 error with invalid id format', async () => {
      const invalidId = 'someStupidText';
      const result = await request(app)
        .get(`/glossary/${invalidId}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.invalidIdFormat);
    });
    it('Should be 404 error when id not exists in glossary collection', async () => {
      const result = await request(app)
        .get(`/glossary/${CollectionHelper.makeNotExistingId()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemNotFound);
    });
    it('Should be 404 error id exists in glossary collection but glossary is disabled', async () => {
      const disabledGlossary = await glossaryCollection.findOne({ isEnabled: false });
      const result = await request(app)
        .get(`/glossary/${disabledGlossary!._id.toString()}`)
        .set('Accept-Language', 'en');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemNotFound);
    });
    it('Should be status 200 and proper response object ', async () => {
      const creator = await userCollection.findOne({ _id: someGlossary!.creator });
      for (const validLanguage of Object.keys(validLanguages)) {
        const result = await request(app)
          .get(`/glossary/${someGlossary!._id.toString()}`)
          .set('Accept-Language', validLanguage);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.abbreviation).toEqual(someGlossary!.abbreviation);
        expect(response.explication).toEqual(someGlossary!.explication);
        expect(response.phrase).toEqual(someGlossary!.phrase);
        expect(response.explanation).toEqual(someGlossary!.explanation[validLanguage]);
        expect(response.abbreviation).toEqual(someGlossary!.abbreviation);
        expect(response.creator._id).toEqual(someGlossary!.creator.toString());
        expect(response.creator._id).toEqual(creator!._id.toString());
        expect(response.creator.firstName).toEqual(creator!.firstName);
        expect(response.creator.lastName).toEqual(creator!.lastName);
        expect(response.isEnabled).toBeUndefined();
      }
    });
  });
  describe('Admin endpoint', () => {
    let someGlossary: any;
    let somUser: any;
    it('Should be 401 error when url contains \'admin\' and missing Authorization header', async () => {
      someGlossary = await CollectionHelper.getSomeDocument(glossaryCollection, 2);
      const result = await request(app)
        .get(`/admin/glossary/${someGlossary!._id.toString()}`)
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(401);
      expect(response).toEqual(errorsMessages.missingAuthorization);
    });
    it('Should be 401 error with invalid jwtToken', async () => {
      const result = await request(app)
        .get(`/admin/glossary/${someGlossary!._id.toString()}`)
        .set('Authorization', 'Bearer ' + CollectionHelper.makeInvalidToken())
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(401);
    });
    it('Should be 401 error with expired token', async () => {
      somUser = await CollectionHelper.getSomeDocument(userCollection, 14);
      const auth = new Authentication();
      const expiredLogin = await auth.login(somUser!.email, somUser!.firstName, '1ms');
      const result = await request(app)
        .get(`/admin/glossary/${someGlossary!._id.toString()}`)
        .set('Authorization', 'Bearer ' + expiredLogin.jwtToken)
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(401);
    });
    it('Should be 200 status code and proper response with valid jwtToken', async () => {
      const creator = await userCollection.findOne({ _id: someGlossary!.creator });
      const auth = new Authentication();
      const userLogin = await auth.login(somUser!.email, somUser!.firstName);
      const result = await request(app)
        .get(`/admin/glossary/${someGlossary!._id.toString()}`)
        .set('Authorization', 'Bearer ' + userLogin.jwtToken)
        .set('Accept-Language', 'pl');
      expect(result.status).toEqual(200);
      const response = JSON.parse(result.text);
      expect(response.abbreviation).toEqual(someGlossary!.abbreviation);
      expect(response.explication).toEqual(someGlossary!.explication);
      expect(response.phrase).toEqual(someGlossary!.phrase);
      expect(response.explanation).toEqual(someGlossary!.explanation);
      expect(response.abbreviation).toEqual(someGlossary!.abbreviation);
      expect(response.creator._id).toEqual(someGlossary!.creator.toString());
      expect(response.creator._id).toEqual(creator!._id.toString());
      expect(response.creator.firstName).toEqual(creator!.firstName);
      expect(response.creator.lastName).toEqual(creator!.lastName);
      expect(response.isEnabled).toEqual(someGlossary!.isEnabled);
    });
  });
});

describe('GET paginated glossary', () => {
  describe('Common errors handling', () => {
    it('Should be 422 error without Accept-Language header', async () => {
      const result = await request(app)
        .get('/glossary');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingLang);
    });
    it('Should be 422 error with incorrect language ', async () => {
      const incorrectLangs = ['de', 'fr', 'ru'];
      for (const incorrectLang of incorrectLangs) {
        const result = await request(app)
          .get('/glossary')
          .set('Accept-Language', incorrectLang);
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.invalidLang);
      }
    });
    it('Should be 422 error without perPage variable in query ', async () => {
      const result = await request(app)
        .get('/glossary')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingPerPage);
    });
    it('Should be 422 error without page variable in query ', async () => {
      const result = await request(app)
        .get('/glossary?perPage=4')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.missingPage);
    });
    it('Should be 422 error when perPage variable is string ', async () => {
      const result = await request(app)
        .get('/glossary?perPage=string&page=2')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPerPage);
    });
    it('Should be 422 error when page variable is string ', async () => {
      const result = await request(app)
        .get('/glossary?perPage=33&page=string')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPage);
    });
    it('Should be 422 error when perPage variable is not integer ', async () => {
      const result = await request(app)
        .get('/glossary?perPage=2.6&page=2')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPerPage);
    });
    it('Should be 422 error when page variable is not integer ', async () => {
      const result = await request(app)
        .get('/glossary?perPage=33&page=5.7')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.noIntegerPage);
    });
    it('Should be 404 error when page is bigger than totalPages ', async () => {
      const result = await request(app)
        .get('/glossary?perPage=3&page=105')
        .set('Accept-Language', 'pl');
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(404);
      expect(response).toEqual(errorsMessages.itemsNotFound);
    });
  });
  describe('Preview endpoint', () => {
    describe('Response validation', () => {
      let totalEnabledGlossaries: number;
      it('Should be only enabled documents in data array', async () => {
        totalEnabledGlossaries = await glossaryCollection.countDocuments({ isEnabled: true });
        const result = await request(app)
          .get('/glossary?perPage=100&page=1')
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalEnabledGlossaries);
      });
      it('Should be proper response not on last page', async () => {
        const perPage = 10;
        const page = 2;
        const result = await request(app)
          .get(`/glossary?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(perPage);
        expect(response.currentPage).toEqual(page);
        expect(response.docsOnPage).toEqual(perPage);
        expect(response.totalDocs).toEqual(totalEnabledGlossaries);
        expect(response.totalPages).toEqual(Math.ceil(totalEnabledGlossaries / perPage));
      });
      it('Should be proper response on last page', async () => {
        const perPage = 8;
        const page = 6;
        const result = await request(app)
          .get(`/glossary?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalEnabledGlossaries - (perPage * (page - 1)));
        expect(response.currentPage).toEqual(page);
        expect(response.docsOnPage).toEqual(totalEnabledGlossaries - (perPage * (page - 1)));
        expect(response.totalDocs).toEqual(totalEnabledGlossaries);
        expect(response.totalPages).toEqual(Math.ceil(totalEnabledGlossaries / perPage));
      });
      it('Should be proper document in data array', async () => {
        const perPage = 8;
        const page = 6;
        for (const validLanguage of Object.keys(validLanguages)) {
          const result = await request(app)
            .get(`/glossary?perPage=${perPage}&page=${page}`)
            .set('Accept-Language', validLanguage);
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(200);
          expect(response.data.length).toEqual(totalEnabledGlossaries - (perPage * (page - 1)));
          expect(response.currentPage).toEqual(page);
          expect(response.docsOnPage).toEqual(totalEnabledGlossaries - (perPage * (page - 1)));
          expect(response.totalDocs).toEqual(totalEnabledGlossaries);
          expect(response.totalPages).toEqual(Math.ceil(totalEnabledGlossaries / perPage));
          const firstGlossaryInDataArray = await glossaryCollection.findOne({ _id: new ObjectId(response.data[0]._id) });
          const creator = await userCollection.findOne({ _id: new ObjectId(response.data[0].creator._id) });
          expect(response.data[0].abbreviation).toEqual(firstGlossaryInDataArray!.abbreviation);
          expect(response.data[0].explication).toEqual(firstGlossaryInDataArray!.explication);
          expect(response.data[0].phrase).toEqual(firstGlossaryInDataArray!.phrase);
          expect(response.data[0].explanation).toEqual(firstGlossaryInDataArray!.explanation[validLanguage].substr(0, 250));
          expect(response.data[0].creator._id).toEqual(creator!._id.toString());
          expect(response.data[0].creator.firstName).toEqual(creator!.firstName);
          expect(response.data[0].creator.lastName).toEqual(creator!.lastName);
          expect(response.data[0].isEnabled).toBeUndefined();
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
          .get(`/admin/glossary?perPage=${perPage}&page=${page}`)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(401);
        expect(response).toEqual(errorsMessages.missingAuthorization);
      });
      it('Should be 401 error with invalid jwtToken', async () => {
        const result = await request(app)
          .get(`/admin/glossary?perPage=${perPage}&page=${page}`)
          .set('Authorization', 'Bearer ' + CollectionHelper.makeInvalidToken())
          .set('Accept-Language', 'pl');
        expect(result.status).toEqual(401);
      });
      it('Should be 401 error with expired token', async () => {
        const auth = new Authentication();
        const expiredLogin = await auth.login(somUser!.email, somUser!.firstName, '1ms');
        const result = await request(app)
          .get(`/admin/glossary?perPage=${perPage}&page=${page}`)
          .set('Authorization', 'Bearer ' + expiredLogin.jwtToken)
          .set('Accept-Language', 'pl');
        expect(result.status).toEqual(401);
      });
    });
    describe('Response validation', () => {
      let totalGlossaryDocuments: number;
      let someUserLogin: any;
      it('Should be enabled and disabled documents in data array', async () => {
        totalGlossaryDocuments = await glossaryCollection.countDocuments();
        const auth = new Authentication();
        someUserLogin = await auth.login(somUser!.email, somUser!.firstName);
        const result = await request(app)
          .get('/admin/glossary?perPage=1000&page=1')
          .set('Authorization', 'Bearer ' + someUserLogin.jwtToken)
          .set('Accept-Language', 'pl');
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(200);
        expect(response.data.length).toEqual(totalGlossaryDocuments);
      });
      it('Should be proper document in data array', async () => {
        const perPage = 8;
        const page = 7;
        for (const validLanguage of Object.keys(validLanguages)) {
          const result = await request(app)
            .get(`/admin/glossary?perPage=${perPage}&page=${page}`)
            .set('Authorization', 'Bearer ' + someUserLogin.jwtToken)
            .set('Accept-Language', validLanguage);
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(200);
          expect(response.data.length).toEqual(totalGlossaryDocuments - (perPage * (page - 1)));
          const firstGlossaryInDataArray = await glossaryCollection.findOne({ _id: new ObjectId(response.data[0]._id) });
          const creator = await userCollection.findOne({ _id: new ObjectId(response.data[0].creator._id) });
          expect(typeof response.data[0].isEnabled).toEqual('boolean');
          expect(response.data[0].abbreviation).toEqual(firstGlossaryInDataArray!.abbreviation);
          expect(response.data[0].explication).toEqual(firstGlossaryInDataArray!.explication);
          expect(response.data[0].phrase).toEqual(firstGlossaryInDataArray!.phrase);
          expect(response.data[0].phrase).toEqual(firstGlossaryInDataArray!.phrase);
          expect(response.data[0].explanation).toEqual(firstGlossaryInDataArray!.explanation[validLanguage].substr(0, 250));
          expect(response.data[0].creator._id).toEqual(creator!._id.toString());
          expect(response.data[0].creator.firstName).toEqual(creator!.firstName);
          expect(response.data[0].creator.lastName).toEqual(creator!.lastName);
          expect(response.data[0].creator.password).toBeUndefined();
          expect(response.data[0].creator.roles).toBeUndefined();
        }
      });
    });
  });
});
