import { Collection } from 'mongodb';
import CollectionHelper from './CollectionHelper';
// @ts-ignore
import faker from 'faker';

class ArticleTypesCollectionSeeder {
  public static async checkAndPrepareArticleTypesCollection (articleTypesCollection: Collection, usersCollection: Collection):Promise<void> {
    const totalArticleTypes = await articleTypesCollection.countDocuments();
    if (totalArticleTypes !== 10) {
      console.log('Preparing articleTypes collection');
      await articleTypesCollection.deleteMany({});
      await ArticleTypesCollectionSeeder.seedArticleTypesCollection(articleTypesCollection, usersCollection);
    }
  }

  public static async seedArticleTypesCollection (articleTypesCollection: Collection, usersCollection: Collection):Promise<any> {
    let articleType;
    let user;
    for (let i = 1; i <= 3; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 1, max: 50 }));
      articleType = {
        name: faker.lorem.words(2),
        type: 'category',
        icon: faker.lorem.word(),
        isEnabled: true,
        description: { pl: 'Opis kategorii', en: 'Category description' },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articleTypesCollection.insertOne(articleType);
    }
    for (let i = 1; i <= 2; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 1, max: 50 }));
      articleType = {
        name: faker.lorem.words(2),
        type: 'category',
        icon: faker.lorem.word(),
        isEnabled: false,
        description: { pl: 'Opis kategorii', en: 'Category description' },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articleTypesCollection.insertOne(articleType);
    }
    for (let i = 1; i <= 3; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 1, max: 50 }));
      articleType = {
        name: faker.lorem.words(2),
        type: 'serie',
        icon: faker.lorem.word(),
        isEnabled: true,
        description: { pl: 'Opis kategorii', en: 'Category description' },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articleTypesCollection.insertOne(articleType);
    }
    for (let i = 1; i <= 2; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 1, max: 50 }));
      articleType = {
        name: faker.lorem.words(2),
        type: 'serie',
        icon: faker.lorem.word(),
        isEnabled: false,
        description: { pl: 'Opis kategorii', en: 'Category description' },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articleTypesCollection.insertOne(articleType);
    }
  }
}

export default ArticleTypesCollectionSeeder;
