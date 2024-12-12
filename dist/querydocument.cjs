

/*const QueryDocumentSchema = {
    type: 'object',
    description: 'Any listing can be arbitrarily filtered using <a href="https://www.mongodb.com/docs/manual/core/document/#std-label-document-query-filter">Mongo Query Document Filters</a>',
    additionalProperties: {
        type: 'object',
        properties: {
            '$in': {type:'array', required:false},
            '$nin': {type:'array', required:false},
            '$exists': {type:'boolean', required:false},
            '$gte': {type:'number', required:false},
            '$gt': {type:'number', required:false},
            '$lte': {type:'number', required:false},
            '$lt': {type:'number', required:false},
            '$eq': { required:false},
            '$ne': { required:false},
            '$mod': {type:'array', required:false},
            '$all': {type:'array', required:false},
            '$and': {
                type:'array',
                items:{
                    $ref:'#/components/schemas/QueryDocumentFilter'
                }, required:false
            },
            '$or': {
                type:'array',
                items:{
                    $ref:'#/components/schemas/QueryDocumentFilter'
                }, required:false
            },
            '$nor': {
                type:'array',
                items:{
                    $ref:'#/components/schemas/QueryDocumentFilter'
                }, required:false
            },
            '$not': {
                type:'array',
                items:{
                    $ref:'#/components/schemas/QueryDocumentFilter'
                }, required:false
            },
            '$size': {type:'integer', required:false},
            '$type': {type:'object', required:false},
            '$elemMatch': {type:'object', required:false}
        }
    }
};*/
"use strict";