/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { Khipu } from '../src/index.mjs';
import { File, FileBuffer } from '@environment-safe/file';
const should = chai.should();

describe('@perigress/khipu', ()=>{
    describe('performs an SQL test suite', ()=>{
        it('generates a table create statement', async ()=>{
            const expected = `CREATE TABLE "user"(
    "handle" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255),
    "password" VARCHAR(255),
    "birthdate" INTEGER,
    "location" VARCHAR(255),
    "confirmed" BOOLEAN
)`;
            should.exist(Khipu);
            const schemaFile = new File( './data/user.schema.json' );
            await schemaFile.load();
            const schema = await schemaFile.body();
            const str = FileBuffer.toString('string', schema);
            const data = JSON.parse(str);
            const queryBuilder = new Khipu({output: 'SQL'});
            const statements = await queryBuilder.buildInitializationStatement(data);
            statements[0].should.equal(expected);
        });
    });
});

