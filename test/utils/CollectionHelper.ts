import { Collection, ObjectId } from 'mongodb';
import Encryption from '../../src/Security/Encryption';
import Authentication from '../../src/Repository/Authentication';

class CollectionHelper {
  static encryption: Encryption = new Encryption();
  static auth: Authentication = new Authentication();

  static async getSomeDocument (collection:Collection, skip:number) {
    return await collection.findOne({}, { skip: skip });
  }

  static makeNotExistingId () {
    return new ObjectId();
  }

  static makeInvalidToken () {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJjb8WbdGFtIiwicm9sZXMiOlsiUk9MRV9VU0VSIl0sImlhdCI6MTYyOTc3ODA1NSwiZXhwIjoxNjI5NzgxNjU1fQ.p0X80GrRriYZ_azhPS2l7Zd3qbRRPNnT8jfO5oqZ';
  }

  static makeJwtTokenWithNotCorrectIdFormat () {
    return this.encryption.signJwtToken({ _id: 'cośtam', roles: ['ROLE_USER'] }, '1h');
  }

  static makeJwtTokenWithIdNotExistsInUsersCollection () {
    return this.encryption.signJwtToken({ _id: CollectionHelper.makeNotExistingId(), roles: ['ROLE_USER'] }, '1h');
  }

  static async getLastUserAndLogin (userCollection: Collection) {
    const lastUser = await userCollection.findOne({}, { skip: 50 });
    return await this.auth.login(lastUser!.email, 'Test1234$');
  }

  static async getFirstAdminAndLogin (userCollection: Collection) {
    const adminUser = await userCollection.findOne({ roles: ['ROLE_ADMIN'] });
    return await this.auth.login(adminUser!.email, adminUser!.firstName);
  }
}

export default CollectionHelper;
