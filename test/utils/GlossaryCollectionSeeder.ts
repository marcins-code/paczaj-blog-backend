import { Collection } from 'mongodb';
import CollectionHelper from './CollectionHelper';
// @ts-ignore
import faker from 'faker';

class GlossaryCollectionSeeder {
  public static async checkAndPrepareGlossaryCollection (glossaryCollection: Collection, usersCollection: Collection):Promise<void> {
    const totalGlossary = await glossaryCollection.countDocuments();
    if (totalGlossary !== 50) {
      console.log('Preparing glossary collection');
      await glossaryCollection.deleteMany({});
      await GlossaryCollectionSeeder.seedGlossaryCollection(glossaryCollection, usersCollection);
    }
  }

  public static async seedGlossaryCollection (glossaryCollection: Collection, usersCollection: Collection):Promise<any> {
    let glossary: any;
    let user;
    for (let i = 1; i <= 5; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 0, max: 50 }));
      glossary = {
        abbreviation: faker.lorem.word(faker.datatype.number({ min: 2, max: 7 })),
        explication: faker.lorem.words(faker.datatype.number({ min: 3, max: 10 })),
        phrase: faker.lorem.sentence(faker.datatype.number({ min: 3, max: 10 })),
        isEnabled: true,
        explanation: {
          pl: faker.lorem.paragraphs(faker.datatype.number({ min: 3, max: 10 })),
          en: faker.lorem.paragraphs(faker.datatype.number({ min: 3, max: 10 }))
        },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await glossaryCollection.insertOne(glossary);
    }
    for (let i = 1; i <= 5; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 0, max: 50 })); glossary = {
        abbreviation: faker.lorem.word(faker.datatype.number({ min: 2, max: 7 })),
        explication: faker.lorem.words(faker.datatype.number({ min: 3, max: 10 })),
        phrase: faker.lorem.sentence(faker.datatype.number({ min: 3, max: 10 })),
        isEnabled: false,
        explanation: {
          pl: faker.lorem.paragraphs(faker.datatype.number({ min: 3, max: 10 })),
          en: faker.lorem.paragraphs(faker.datatype.number({ min: 3, max: 10 }))
        },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await glossaryCollection.insertOne(glossary);
    }
    for (let i = 1; i <= 40; i++) {
      user = await CollectionHelper.getSomeDocument(usersCollection, faker.datatype.number({ min: 1, max: 40 }));
      glossary = {
        abbreviation: faker.lorem.word(faker.datatype.number({ min: 2, max: 7 })),
        explication: faker.lorem.words(faker.datatype.number({ min: 3, max: 10 })),
        phrase: faker.lorem.sentence(faker.datatype.number({ min: 3, max: 10 })),
        isEnabled: true,
        explanation: {
          pl: faker.lorem.paragraphs(faker.datatype.number({ min: 3, max: 10 })),
          en: faker.lorem.paragraphs(faker.datatype.number({ min: 3, max: 10 }))
        },
        creator: user!._id,
        createdAt: faker.date.between('2020-11-01', '2021-09-15'),
        updatedAt: faker.date.between('2020-11-01', '2021-09-15')
      };
      await glossaryCollection.insertOne(glossary);
    }
  }
}

export default GlossaryCollectionSeeder;
