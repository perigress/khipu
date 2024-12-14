khipu
=====
khipu is a utility for turning sets of json and json schema into SQL and MongoQueryDocuments, named for [khipu](https://en.wikipedia.org/wiki/Quipu) a record keeping technique in the Incan empire

Usage
-----

```js
import { Khipu } from '@perigress/khipu';

const queryBuilder = new Khipu({output: 'SQL'});
const statements = await queryBuilder.buildInitializationStatement({
    "$id": "https://example.com/user.schema.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "name":"user",
    "description": "A set of audit fields available on every ",
    "type": "object",
    "required": ["handle", "email"],
    "properties": {
        "handle": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "fullName": {
          "type": "string"
        },
        "birthdate": {
          "type": "integer"
        },
        "location": {
          "type": "string"
        },
        "confirmed": {
          "type": "boolean"
        }
    }
});
/*
statements contains:
'CREATE TABLE "user"(
    "handle" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255),
    "birthdate" INTEGER,
    "location" VARCHAR(255),
    "confirmed" BOOLEAN
)'
*/


```

Testing
-------

Run the es module tests to test the root modules
```bash
npm run import-test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless in chrome:
```bash
npm run headless-browser-test
```

to run the same test inside docker:
```bash
npm run container-test
```

Run the commonjs tests against the `/dist` commonjs source (generated with the `build-commonjs` target).
```bash
npm run require-test
```

Development
-----------
All work is done in the .mjs files and will be transpiled on commit to commonjs and tested.

If the above tests pass, then attempt a commit which will generate .d.ts files alongside the `src` files and commonjs classes in `dist`

