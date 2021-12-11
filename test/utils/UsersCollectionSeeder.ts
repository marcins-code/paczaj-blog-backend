import { Collection } from 'mongodb';
import UserEntity from '../../src/Entity/UserEntity';
import * as faker from 'faker';
// @ts-ignore
import bcrypt from 'bcrypt';

const saltRounds = 10;

class UsersCollectionSeeder {
  public static async checkAndPrepareUsersCollection (userCollection: Collection):Promise<void> {
    const totalUser = await userCollection.countDocuments();
    const totalAdmins = await userCollection.countDocuments({ roles: ['ROLE_ADMIN'] });
    const totalSuperAdmins = await userCollection.countDocuments({ roles: ['ROLE_SUPERADMIN'] });
    if (totalUser !== 50 || totalAdmins !== 2 || totalSuperAdmins !== 2) {
      console.log('Preparing users collection');
      await userCollection.deleteMany({});
      await UsersCollectionSeeder.seedUsersCollection(userCollection);
    }
  }

  public static async seedUsersCollection (userCollection: Collection) {
    // enabled users
    for (let i = 1; i <= 23; i++) {
      const user = new UserEntity(
        faker.name.firstName(),
        faker.name.lastName(),
        faker.internet.email(),
        'somePass',
        true,
        faker.internet.avatar(),
        ['ROLE_USER'],
        {
          pl: 'Coś tam po polsku',
          en: 'Something in english'
        }
      );
      const userToSeed = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: await bcrypt.hash(user.firstName, saltRounds),
        isEnabled: user.isEnabled,
        roles: user.roles,
        avatar: user.avatar,
        aboutMe: user.aboutMe
      };
      await userCollection.insertOne(userToSeed);
    }
    // disabled users
    for (let i = 1; i <= 23; i++) {
      const user = new UserEntity(
        faker.name.firstName(),
        faker.name.lastName(),
        faker.internet.email(),
        'somePass',
        false,
        faker.internet.avatar(),
        ['ROLE_USER'],
        {
          pl: 'Coś tam po polsku',
          en: 'Something in english'
        }
      );
      const userToSeed = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: await bcrypt.hash(user.firstName, saltRounds),
        isEnabled: user.isEnabled,
        roles: user.roles,
        avatar: user.avatar,
        aboutMe: user.aboutMe
      };
      await userCollection.insertOne(userToSeed);
    }
    // admins
    for (let i = 1; i <= 2; i++) {
      const user = new UserEntity(
        faker.name.firstName(),
        faker.name.lastName(),
        faker.internet.email(),
        'somePass',
        true,
        faker.internet.avatar(),
        ['ROLE_ADMIN'],
        {
          pl: 'Coś tam po polsku',
          en: 'Something in english'
        }
      );
      const userToSeed = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: await bcrypt.hash(user.firstName, saltRounds),
        isEnabled: user.isEnabled,
        roles: user.roles,
        avatar: user.avatar,
        aboutMe: user.aboutMe
      };
      await userCollection.insertOne(userToSeed);
    }
    // superAdmins
    for (let i = 1; i <= 1; i++) {
      const user = new UserEntity(
        faker.name.firstName(),
        faker.name.lastName(),
        faker.internet.email(),
        'somePass',
        true,
        faker.internet.avatar(),
        ['ROLE_SUPERADMIN'],
        {
          pl: 'Coś tam po polsku',
          en: 'Something in english'
        }
      );
      const userToSeed = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: await bcrypt.hash(user.firstName, saltRounds),
        isEnabled: user.isEnabled,
        roles: user.roles,
        avatar: user.avatar,
        aboutMe: user.aboutMe
      };
      await userCollection.insertOne(userToSeed);
    }

    // Marcin seed
    for (let i = 1; i <= 1; i++) {
      const user = new UserEntity(
        'Marcin',
        'Paczkowski',
        'email@marcin.pl',
        'somePass',
        true,
        faker.internet.avatar(),
        ['ROLE_SUPERADMIN'],
        {
          pl: 'Cześc!. Jestem Marcin',
          en: 'Something in english'
        }
      );
      const userToSeed = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: await bcrypt.hash(user.firstName, saltRounds),
        isEnabled: user.isEnabled,
        roles: user.roles,
        avatar: user.avatar,
        aboutMe: user.aboutMe
      };
      await userCollection.insertOne(userToSeed);
    }
  }

  public static setUserForTest () {
    return {
      body: {
        firstName: 'Edwin',
        lastName: 'Ogórek',
        email: 'eogorek@test.pl',
        password: 'Test1234$',
        aboutMe: {
          pl: 'Jakiś tekst',
          en: 'Some text'
        },
        avatar: 'https://cdn.fakercloud.com/avatars/anatolinicolae_128.jpg',
        isEnabled: true,
        roles: ['ROLE_USER']
      }
    };
  }

  public static setUserForTestToUpdate () {
    return {
      body: {
        firstName: 'Edward-Eustachy',
        lastName: 'Pomidor',
        email: 'pomidor@test.pl',
        aboutMe: {
          pl: 'Jakiś nowy tekst',
          en: 'Some new  text'
        },
        avatar: 'https://cdn.fakercloud.com/avatars/Chakintosh_128.jpg',
        isEnabled: true,
        roles: ['ROLE_USER', 'ROLE_EDITOR']
      }
    };
  }
}

export default UsersCollectionSeeder;
