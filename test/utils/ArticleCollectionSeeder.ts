import { Collection, Document } from 'mongodb';
import CollectionHelper from './CollectionHelper';
// @ts-ignore
import faker from 'faker';

class ArticleCollectionSeeder {
  public static async checkAndPrepareArticlesCollection (
    articlesCollection: Collection,
    articleTypesCollection: Collection,
    usersCollection: Collection):Promise<void> {
    const totalArticles = await articlesCollection.countDocuments();
    if (totalArticles !== 30) {
      console.log('Preparing glossary collection');
      await articlesCollection.deleteMany({});
      await ArticleCollectionSeeder.seedGlossaryCollection(articlesCollection, articleTypesCollection, usersCollection);
    }
  }

  public static async seedGlossaryCollection (
    articlesCollection: Collection,
    articleTypesCollection: Collection,
    usersCollection: Collection):Promise<any> {
    let article:Document | null;
    let articleType: Document | null;
    let user:Document | null;
    for (let i = 1; i <= 5; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 0, max: 49 }));
      articleType = await CollectionHelper.getSomeDocument(articleTypesCollection, faker.datatype.number({ min: 0, max: 9 }));
      article = {
        titlePl: faker.lorem.words(faker.datatype.number({ min: 5, max: 10 })),
        titleEn: faker.lorem.words(faker.datatype.number({ min: 5, max: 10 })),
        articleType: articleType!.type,
        articleTypeId: articleType!._id,
        seriePart: faker.datatype.number({ min: 1, max: 10 }),
        isEnabled: true,
        creator: user!._id,
        content: {
          pl: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 40 })),
          en: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 40 }))
        },
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articlesCollection.insertOne(article);
    }
    for (let i = 1; i <= 20; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 0, max: 49 }));
      articleType = await CollectionHelper.getSomeDocument(articleTypesCollection, faker.datatype.number({ min: 0, max: 9 }));
      article = {
        titlePl: faker.lorem.words(faker.datatype.number({ min: 5, max: 10 })),
        titleEn: faker.lorem.words(faker.datatype.number({ min: 5, max: 10 })),
        articleType: articleType!.type,
        articleTypeId: articleType!._id,
        seriePart: faker.datatype.number({ min: 1, max: 10 }),
        isEnabled: true,
        creator: user!._id,
        content: {
          pl: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 40 })),
          en: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 40 }))
        },
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articlesCollection.insertOne(article);
    }

    for (let i = 1; i <= 5; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 0, max: 49 }));
      articleType = await CollectionHelper.getSomeDocument(articleTypesCollection, faker.datatype.number({ min: 0, max: 9 }));
      article = {
        titlePl: faker.lorem.words(faker.datatype.number({ min: 5, max: 10 })),
        titleEn: faker.lorem.words(faker.datatype.number({ min: 5, max: 10 })),
        articleType: articleType!.type,
        articleTypeId: articleType!._id,
        seriePart: faker.datatype.number({ min: 1, max: 10 }),
        isEnabled: false,
        creator: user!._id,
        content: {
          pl: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 40 })),
          en: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 40 }))
        },
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await articlesCollection.insertOne(article);
    }
  }
}

export default ArticleCollectionSeeder;
