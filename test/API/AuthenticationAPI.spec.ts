import { Collection, MongoClient, ObjectId } from 'mongodb';
import { connectionOptions, uri, dbName } from '../../src/Utils/dbConnection';
import Authentication from '../../src/Repository/Authentication';
import UsersCollectionSeeder from '../utils/UsersCollectionSeeder';
// @ts-ignore
import request from 'supertest';
import app from '../../src/app';
import { errorsMessages } from '../../src/Validator/ErrorMessages';
import { wrongEmails, wrongFirstNames, wrongLastNames, wrongPasswords } from '../utils/wrongFormatsArrays';
import CollectionHelper from '../utils/CollectionHelper';
// @ts-ignore
import bcrypt from 'bcrypt';
import Encryption from '../../src/Security/Encryption';

let connection: void | MongoClient;
let userCollection: Collection;

beforeAll(async () => {
  // connection
  connection = await MongoClient.connect(uri, connectionOptions);
  // injection db
  await Authentication.injectDB(connection);

  // collections
  userCollection = await connection.db(dbName).collection('users');
  await UsersCollectionSeeder.checkAndPrepareUsersCollection(userCollection);
}, 15000);

afterAll(async () => {
  console.log('Cleaning after authentication tests');
  await userCollection.deleteMany({ firstName: 'Edwin' });
});

describe('SignUp', () => {
  describe('Validation missing field and invalid formats field errors', () => {
    describe('firstName validation', () => {
      let userForTest: any;
      it('Should be error without firstName field ', async () => {
        userForTest = UsersCollectionSeeder.setUserForTest().body;
        // @ts-ignore
        delete userForTest.firstName;
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.firstNameIsRequired);
      });
      it('Should be error when firstName is too short ', async () => {
        userForTest.firstName = 'D';
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.firstNameTooShort);
      });
      it('Should be error when firstName is too long ', async () => {
        userForTest.firstName = 'Edward-JeanLudwikJacekPlacekAntoniAlojzyMarcinGrzegorz';
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.firstNameTooLong);
      });
      it('Should be error when firstName has wrong format ', async () => {
        for (const wrongFirstName of wrongFirstNames) {
          userForTest.firstName = wrongFirstName;
          const result = await request(app)
            .post('/user/signUp')
            .send({ ...userForTest });
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(422);
          expect(response).toEqual(errorsMessages.firstNameNotMatch);
        }
      });
    });
    describe('lastName validation', () => {
      let userForTest: any;
      it('Should be error without lastName field ', async () => {
        userForTest = UsersCollectionSeeder.setUserForTest().body;
        // @ts-ignore
        delete userForTest.lastName;
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.lastNameIsRequired);
      });
      it('Should be error when lastName is too short ', async () => {
        userForTest.lastName = 'D';
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.lastNameTooShort);
      });
      it('Should be error when lastName is too long ', async () => {
        userForTest.lastName = 'Edward-JeanLudwikJacekPlacekAntoniAlojzyMarcinGrzegorz';
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.lastNameTooLong);
      });
      it('Should be error when firstName has wrong format ', async () => {
        for (const wrongLastName of wrongLastNames) {
          userForTest.lastName = wrongLastName;
          const result = await request(app)
            .post('/user/signUp')
            .send({ ...userForTest });
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(422);
          expect(response).toEqual(errorsMessages.lastNameNotMatch);
        }
      });
    });
    describe('email validation', () => {
      let userForTest: any;
      it('Should be error without firstName field ', async () => {
        userForTest = UsersCollectionSeeder.setUserForTest().body;
        // @ts-ignore
        delete userForTest.email;
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.emailIsRequired);
      });
      it('Should be error when email is too long', async () => {
        userForTest.email = 'BrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiBrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiBrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiBrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiLudwiniakPełczyńskiZagajewsksiLudwiniakPełczyńskiZagajewski@costam.com';
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.emailTooLong);
      });
      it('Should be error when email has wrong format ', async () => {
        for (const wrongEmail of wrongEmails) {
          userForTest.email = wrongEmail;
          const result = await request(app)
            .post('/user/signUp')
            .send({ ...userForTest });
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(422);
          expect(response).toEqual(errorsMessages.invalidEmailFormat);
        }
      });
    });
    describe('password validation', () => {
      let userForTest: any;
      it('Should be error without firstName field ', async () => {
        userForTest = UsersCollectionSeeder.setUserForTest().body;
        // @ts-ignore
        delete userForTest.password;
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.passwordIsRequired);
      });
      it('Should be error when password has wrong format ', async () => {
        for (const wrongPassword of wrongPasswords) {
          userForTest.password = wrongPassword;
          const result = await request(app)
            .post('/user/signUp')
            .send({ ...userForTest });
          const response = JSON.parse(result.text);
          expect(result.status).toEqual(422);
          expect(response).toEqual(errorsMessages.passwordNotMatch);
        }
      });
    });
    describe('Validation email uniqueness', () => {
      it('Should be error if given email already exists in users collection', async () => {
        const fifthUser = await CollectionHelper.getSomeDocument(userCollection, 4);
        const userForTest = UsersCollectionSeeder.setUserForTest().body;
        userForTest.email = fifthUser!.email;
        const result = await request(app)
          .post('/user/signUp')
          .send({ ...userForTest });
        const response = JSON.parse(result.text);
        expect(result.status).toEqual(422);
        expect(response).toEqual(errorsMessages.emailExists);
      });
    });
  });
  describe('Validation response and inserted document structure', () => {
    let userForTest: any;
    let lastDocument:any;
    it('Should be proper response', async () => {
      userForTest = UsersCollectionSeeder.setUserForTest().body;
      const result = await request(app)
        .post('/user/signUp')
        .send({ ...userForTest });
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(201);
      expect(response.acknowledged).toEqual(true);
      expect(ObjectId.isValid(response.insertedId)).toBeTruthy();
    });
    it('Should proper structure in inserted document', async () => {
      lastDocument = await userCollection.findOne({}, { skip: 50 });
      expect(lastDocument!.firstName).toEqual(userForTest.firstName);
      expect(lastDocument!.lastName).toEqual(userForTest.lastName);
      expect(lastDocument!.email).toEqual(userForTest.email);
      expect(lastDocument!.avatar).toEqual(userForTest.avatar);
      expect(lastDocument!.isEnabled).toEqual(userForTest.isEnabled);
      expect(lastDocument!.aboutMe).toEqual(userForTest.aboutMe);
      expect(lastDocument!.roles).toEqual(userForTest.roles);
      expect(lastDocument!.createdAt).toBeInstanceOf(Date);
      expect(lastDocument!._id).toBeInstanceOf(ObjectId);
    });
    it('Should proper hashed password', async () => {
      expect(await bcrypt.compare(userForTest.password, lastDocument.password)).toBeTruthy();
    });
  });
});
describe('Login', () => {
  let someUser:any;
  let loginResponse: any;
  it('Should be 422 error with invalid email format', async () => {
    for (const wrongEmail of wrongEmails) {
      const result = await request(app)
        .post('/user/login')
        .send({ email: wrongEmail, password: 'somePass' });
      const response = JSON.parse(result.text);
      expect(result.status).toEqual(422);
      expect(response).toEqual(errorsMessages.invalidEmailFormat);
    }
  });
  it('Should be 401 error with not exists email in collection', async () => {
    const result = await request(app)
      .post('/user/login')
      .send({ email: 'some@email.com', password: 'somePass' });
    const response = JSON.parse(result.text);
    expect(result.status).toEqual(401);
    expect(response).toEqual(errorsMessages.incorrectEmail);
  });
  it('Should be 401 error with not valid password', async () => {
    someUser = await CollectionHelper.getSomeDocument(userCollection, 14);
    const result = await request(app)
      .post('/user/login')
      .send({ email: someUser!.email, password: 'somePass' });
    const response = JSON.parse(result.text);
    expect(result.status).toEqual(401);
    expect(response).toEqual(errorsMessages.incorrectPassword);
  });
  it('Should be proper response with correct credentials', async () => {
    someUser = await CollectionHelper.getSomeDocument(userCollection, 14);
    const result = await request(app)
      .post('/user/login')
      .send({ email: someUser!.email, password: someUser!.firstName });
    loginResponse = JSON.parse(result.text);
    expect(result.status).toEqual(200);
    expect(loginResponse.firstName).toEqual(someUser!.firstName);
    expect(loginResponse.lastName).toEqual(someUser!.lastName);
    expect(loginResponse._id).toEqual(someUser!._id.toString());
  });
  it('Should be proper data encoded in jwtToken', async () => {
    const encryption = new Encryption();
    const tokenData = encryption.verifyJwtToken(loginResponse.jwtToken);
    expect(tokenData._id).toEqual(someUser!._id.toString());
    expect(tokenData.roles).toEqual(someUser!.roles);
  });
  it('Should be lastLogin field in document', async () => {
    const updatedUser = await CollectionHelper.getSomeDocument(userCollection, 14);
    expect(updatedUser!.lastLogin.lastJwtToken).toEqual(loginResponse.jwtToken);
    expect(updatedUser!.lastLogin.dateTime).toBeInstanceOf(Date);
  });
});
// describe('Creation user by UserRepository', () => {
//   it('Should be error whe attempt to create user by "createDocument" method', async () => {
//     const repository = new UserRepository('pl');
//     try {
//       const newUser = repository.createDocument();
//       expect(newUser).toThrowError();
//     } catch (err: any) {
//       expect(err.code).toEqual(401);
//       expect(err.message).toEqual(errorsMessages.createUserError);
//     }
//   });
// });
// describe('Updating user', () => {
//   let lastUser:any;
//   let logInLastUser:any;
//   describe('Error handling', () => {
//     describe('Authorization and id errors', () => {
//       it('Should be 422 error with invalid LANGUAGE', async () => {
//         lastUser = await CollectionHelper.getSomeDocument(userCollection, 50);
//         const incorrectLangs = ['de', 'fr', 'be'];
//         for (const incorrectLang of incorrectLangs) {
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Accept', 'application/json')
//             .set('Application-Language', incorrectLang)
//             .send({ email: 'some', password: 'some' });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.invalidLang);
//         }
//       });
//       it('Should be 401 error without token', async () => {
//         const result = await request(app)
//           .put(`/user/update/${lastUser._id.toString()}`)
//           .set('Accept', 'application/json')
//           .set('Application-Language', 'en')
//           .send({ email: 'some', password: 'some' });
//         const response = JSON.parse(result.text);
//         expect(result.status).toEqual(401);
//         expect(response).toEqual(errorsMessages.missingAuthorization);
//       });
//       it('Should be 401 error with invalid jwtToken format', async () => {
//         const result = await request(app)
//           .put(`/user/update/${lastUser._id.toString()}`)
//           .set('Accept', 'application/json')
//           .set('Application-Language', 'pl')
//           .set('Authorization', `Bearer ${CollectionHelper.makeInvalidToken()}`)
//           .send({ email: 'some', password: 'some' });
//         const response = JSON.parse(result.text);
//         expect(result.status).toEqual(401);
//         expect(response).toEqual(errorsMessages.invalidToken);
//       });
//       it('Should be 401 error with invalid id format encoded in jwtToken', async () => {
//         const result = await request(app)
//           .put(`/user/update/${lastUser._id.toString()}`)
//           .set('Accept', 'application/json')
//           .set('Application-Language', 'pl')
//           .set('Authorization', `Bearer ${CollectionHelper.makeJwtTokenWithNotCorrectIdFormat()}`)
//           .send({ email: 'some', password: 'some' });
//         const response = JSON.parse(result.text);
//         expect(result.status).toEqual(401);
//         expect(response).toEqual(errorsMessages.invalidToken);
//       });
//       it('Should be 401 error if encoded in jwtToken id does not exists in user collection', async () => {
//         const result = await request(app)
//           .put(`/user/update/${lastUser._id.toString()}`)
//           .set('Accept', 'application/json')
//           .set('Application-Language', 'pl')
//           .set('Authorization', `Bearer ${CollectionHelper.makeJwtTokenWithIdNotExistsInUsersCollection()}`)
//           .send({ email: 'some', password: 'some' });
//         const response = JSON.parse(result.text);
//         expect(result.status).toEqual(401);
//         expect(response).toEqual(errorsMessages.invalidToken);
//       });
//     });
//     describe('Given data errors', () => {
//       describe('id errors', () => {
//         it('Should be 422 error with invalid id format', async () => {
//           const result = await request(app)
//             .put('/user/update/someId}')
//             .set('Accept', 'application/json')
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${CollectionHelper.makeJwtTokenWithIdNotExistsInUsersCollection()}`)
//             .send({ email: 'some', password: 'some' });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.invalidIdFormat);
//         });
//         it('Should be 404 error when id not exists in collection ', async () => {
//           logInLastUser = await CollectionHelper.getLastUserAndLogin(userCollection);
//           const result = await request(app)
//             .put(`/user/update/${CollectionHelper.makeNotExistingId()}`)
//             .set('Accept', 'application/json')
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ email: 'some', password: 'some' });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(404);
//           expect(response).toEqual(errorsMessages.idNotExists);
//         });
//       });
//       describe('firstName errors', () => {
//         let userForTestToUpdate:any;
//         it('Should be 422 error without firstName field ', async () => {
//           userForTestToUpdate = CollectionSeeder.setUserForTestToUpdate().body;
//           // @ts-ignore
//           delete userForTestToUpdate.firstName;
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.firstNameIsRequired);
//         });
//         it('Should be 422 error when firstName is too short ', async () => {
//           userForTestToUpdate.firstName = 'D';
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.firstNameTooShort);
//         });
//         it('Should be 422 error when firstName is too long ', async () => {
//           userForTestToUpdate.firstName = 'Edward-JeanLudwikJacekPlacekAntoniAlojzyMarcinGrzegorz';
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.firstNameTooLong);
//         });
//         it('Should be 422 error when firstName has wrong format', async () => {
//           for (const wrongFirstName of wrongFirstNames) {
//             userForTestToUpdate.firstName = wrongFirstName;
//             const result = await request(app)
//               .put(`/user/update/${lastUser._id.toString()}`)
//               .set('Application-Language', 'pl')
//               .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//               .send({ ...userForTestToUpdate });
//             const response = JSON.parse(result.text);
//             expect(result.status).toEqual(422);
//             expect(response).toEqual(errorsMessages.firstNameNotMatch);
//           }
//         });
//       });
//       describe('lastName errors', () => {
//         let userForTestToUpdate:any;
//         it('Should be 422 error without lastName field ', async () => {
//           userForTestToUpdate = CollectionSeeder.setUserForTestToUpdate().body;
//           // @ts-ignore
//           delete userForTestToUpdate.lastName;
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.lastNameIsRequired);
//         });
//         it('Should be 422 error when firstName is too short ', async () => {
//           userForTestToUpdate.lastName = 'D';
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.lastNameTooShort);
//         });
//         it('Should be 422 error when firstName is too long ', async () => {
//           userForTestToUpdate.lastName = 'Edward-JeanLudwikJacekPlacekAntoniAlojzyMarcinGrzegorz';
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.lastNameTooLong);
//         });
//         it('Should be 422 error when firstName has wrong format', async () => {
//           for (const wrongLastName of wrongLastNames) {
//             userForTestToUpdate.lastName = wrongLastName;
//             const result = await request(app)
//               .put(`/user/update/${lastUser._id.toString()}`)
//               .set('Application-Language', 'pl')
//               .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//               .send({ ...userForTestToUpdate });
//             const response = JSON.parse(result.text);
//             expect(result.status).toEqual(422);
//             expect(response).toEqual(errorsMessages.lastNameNotMatch);
//           }
//         });
//       });
//       describe('email errors', () => {
//         let userForTestToUpdate:any;
//         it('Should be 422 error without email field ', async () => {
//           userForTestToUpdate = CollectionSeeder.setUserForTestToUpdate().body;
//           // @ts-ignore
//           delete userForTestToUpdate.email;
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.emailIsRequired);
//         });
//         it('Should be 422 error when email is too long ', async () => {
//           userForTestToUpdate.email = 'BrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiBrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiBrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiBrzęczyszczykiewiczGałęzowskiLudwiniakPełczyńskiZagajewskiLudwiniakPełczyńskiZagajewsksiLudwiniakPełczyńskiZagajewski@costam.com';
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.emailTooLong);
//         });
//         it('Should be 422 error when email has wrong format ', async () => {
//           for (const wrongEmail of wrongEmails) {
//             userForTestToUpdate.email = wrongEmail;
//             const result = await request(app)
//               .put(`/user/update/${lastUser._id.toString()}`)
//               .set('Application-Language', 'pl')
//               .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//               .send({ ...userForTestToUpdate });
//             const response = JSON.parse(result.text);
//             expect(result.status).toEqual(422);
//             expect(response).toEqual(errorsMessages.invalidEmailFormat);
//           }
//         });
//         it('Should be 422 error when email already exists in user collection ', async () => {
//           const someUser = await CollectionHelper.getSomeDocument(userCollection, 10);
//           userForTestToUpdate.email = someUser!.email;
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(422);
//           expect(response).toEqual(errorsMessages.emailExists);
//         });
//       });
//       describe('password field', () => {
//         let userForTestToUpdate:any;
//         it('Should be 401 error when password is given', async () => {
//           userForTestToUpdate = CollectionSeeder.setUserForTestToUpdate().body;
//           userForTestToUpdate.password = 'Test123$%';
//           const result = await request(app)
//             .put(`/user/update/${lastUser._id.toString()}`)
//             .set('Application-Language', 'pl')
//             .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//             .send({ ...userForTestToUpdate });
//           const response = JSON.parse(result.text);
//           expect(result.status).toEqual(401);
//           expect(response).toEqual(errorsMessages.passwordNotAllowed);
//         });
//       });
//     });
//   });
//   describe('Updating user by it self', () => {
//     let userForTestToUpdate:any;
//     it('Should be proper response with valid data ', async () => {
//       userForTestToUpdate = CollectionSeeder.setUserForTestToUpdate().body;
//       const result = await request(app)
//         .put(`/user/update/${lastUser._id.toString()}`)
//         .set('Accept', 'application/json')
//         .set('Application-Language', 'pl')
//         .set('Authorization', `Bearer ${logInLastUser.jwtToken}`)
//         .send({ ...userForTestToUpdate });
//       const response = JSON.parse(result.text);
//       expect(result.status).toEqual(200);
//       expect(response.acknowledged).toEqual(true);
//       expect(response.matchedCount).toEqual(1);
//       expect(response.modifiedCount).toEqual(1);
//       expect(response.upsertedCount).toEqual(0);
//       expect(response.upsertedId).toEqual(null);
//     });
//     it('Should be modified data in document', async () => {
//       const lastUser = await CollectionHelper.getSomeDocument(userCollection, 50);
//       expect(lastUser!.firstName).toEqual(userForTestToUpdate.firstName);
//       expect(lastUser!.lastName).toEqual(userForTestToUpdate.lastName);
//       expect(lastUser!.email).toEqual(userForTestToUpdate.email);
//       expect(lastUser!.avatar).toEqual(userForTestToUpdate.avatar);
//       expect(lastUser!.avatar).toEqual(userForTestToUpdate.avatar);
//       expect(lastUser!.aboutMe).toEqual(userForTestToUpdate.aboutMe);
//       expect(lastUser!.roles).toEqual(userForTestToUpdate.roles);
//       expect(lastUser!.updatedAt).toBeInstanceOf(Date);
//       expect(lastUser!.createdAt).toBeInstanceOf(Date);
//       expect(lastUser!._id).toBeInstanceOf(ObjectId);
//     });
//   });
//   describe('Updating user data by admin', () => {
//     let userForTest:any;
//     it('Should be proper response when logged admin and change last user ', async () => {
//       userForTest = CollectionSeeder.setUserForTest().body;
//       // @ts-ignore
//       delete userForTest.password;
//       const adminLogIn = await CollectionHelper.getLastUserAndLogin(userCollection);
//       const lastUser = await CollectionHelper.getSomeDocument(userCollection, 50);
//       const result = await request(app)
//         .put(`/user/update/${lastUser!._id.toString()}`)
//         .set('Accept', 'application/json')
//         .set('Application-Language', 'pl')
//         .set('Authorization', `Bearer ${adminLogIn.jwtToken}`)
//         .send({ ...userForTest });
//       const response = JSON.parse(result.text);
//       expect(result.status).toEqual(200);
//       expect(response.acknowledged).toEqual(true);
//       expect(response.matchedCount).toEqual(1);
//       expect(response.modifiedCount).toEqual(1);
//       expect(response.upsertedCount).toEqual(0);
//       expect(response.upsertedId).toEqual(null);
//     });
//     it('Should be modified data in document', async () => {
//       const lastUserAfterUpdate = await CollectionHelper.getSomeDocument(userCollection, 50);
//       expect(lastUserAfterUpdate!.firstName).toEqual(userForTest.firstName);
//       expect(lastUserAfterUpdate!.lastName).toEqual(userForTest.lastName);
//       expect(lastUserAfterUpdate!.email).toEqual(userForTest.email);
//       expect(lastUserAfterUpdate!.avatar).toEqual(userForTest.avatar);
//       expect(lastUserAfterUpdate!.avatar).toEqual(userForTest.avatar);
//       expect(lastUserAfterUpdate!.aboutMe).toEqual(userForTest.aboutMe);
//       expect(lastUserAfterUpdate!.roles).toEqual(userForTest.roles);
//       expect(lastUserAfterUpdate!.updatedAt).toBeInstanceOf(Date);
//       expect(lastUserAfterUpdate!.createdAt).toBeInstanceOf(Date);
//       expect(lastUserAfterUpdate!._id).toBeInstanceOf(ObjectId);
//     });
//   });
// });
