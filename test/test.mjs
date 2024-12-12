/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { Khipu } from '../src/index.mjs';
import { File, FileBuffer } from '@environment-safe/file';
const should = chai.should();

describe('@perigress/khipu', ()=>{
    describe('performs an SQL test suite', ()=>{
        it('generates a table create statement', async ()=>{
            should.exist(Khipu);
            const data = await getUserSchema();
            const queryBuilder = new Khipu({output: 'SQL'});
            const statements = await queryBuilder.buildInitializationStatement(data);
            statements[0].should.equal(expected);
        });
        
        it('generates a table update statement', async ()=>{
            should.exist(Khipu);
            const data = await getUserSchema();
            const mutatedData = JSON.parse(JSON.stringify(data));
            mutatedData.properties.givenName = mutatedData.properties.fullName;
            delete mutatedData.properties.fullName;
            mutatedData.properties.counter = { type: 'integer' };
            const queryBuilder = new Khipu({output: 'SQL'});
            const migration = await queryBuilder.buildMigrationStatement(mutatedData, data);
            migration.ups.should.deep.equal(expectedMigration.ups);
            migration.downs.should.deep.equal(expectedMigration.downs);
        });
        
        it('generates a data insert statement', async ()=>{
            should.exist(Khipu);
            const data = await getUserSchema();
            const queryBuilder = new Khipu({output: 'SQL'});
            const statements = await queryBuilder.buildCreateStatement(data, examples);
            const now = statements[0].match(/[0-9]{13}/g)[0];
            const exampleAtNow = examplesInsert.replace(
                /[0-9]{13}/g, now
            );
            statements[0].should.equal(exampleAtNow);
        });
    });
});

const getUserSchema = async ()=>{
    const schemaFile = new File( './data/user.schema.json' );
    await schemaFile.load();
    const schema = await schemaFile.body();
    const str = FileBuffer.toString('string', schema);
    const data = JSON.parse(str);
    return data;
};

const expected = `CREATE TABLE "user"(
    "handle" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255),
    "password" VARCHAR(255),
    "birthdate" INTEGER,
    "location" VARCHAR(255),
    "confirmed" BOOLEAN
)`;

const expectedMigration = {
    ups: [
        'ALTER TABLE user ADD givenName VARCHAR(255)',
        'ALTER TABLE user ADD counter INTEGER',
        'ALTER TABLE user DROP fullName'
    ],
    downs: [
        'ALTER TABLE user DROP givenName',
        'ALTER TABLE user DROP counter',
        'ALTER TABLE user ADD fullName VARCHAR(255)'
    ]
};

const examples = [
    {
        handle: 'edbeggler',
        email: 'foo@bar.com',
        fullName: 'Ed Beggler',
        password: 'frdfnskjfn',
        birthdate: Date.now()
    },
    {
        handle: 'cheetah',
        email: 'khrome@ix.netcom.com',
        fullName: 'Vince Vega',
        password: '1234567890',
        birthdate: Date.now()
    }
];

const examplesInsert = 'INSERT INTO user(handle, email, fullName, password, birthdate) VALUES ("edbeggler", "foo@bar.com", "Ed Beggler", "frdfnskjfn", 1734019311636), ("cheetah", "khrome@ix.netcom.com", "Vince Vega", "1234567890", 1734019311636)';

