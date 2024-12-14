/*
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
//*/

/**
 * A JSON object
 * @typedef { object } JSON
 */
 
import { SQL } from './sql.mjs';

export class Khipu{
    constructor(options={}){
        this.options = options;
        if(!this.options.returnType) this.options.returnType = 'sql:string';
        const parts = this.options.returnType.split(':');
        this.mode = parts[0] || 'sql';
        this.output = parts[1] || 'string';
    }
    
    buildInitializationStatement(schema){
        let query = null;
        //todo: work out escaping in functional mode
        if(this.mode === 'sql'){
            query = SQL.toSQL(schema.name, schema, this.options);
        }
        
        if(this.output === 'string'){
            return query;
        }
        
    }
    
    buildMigrationStatement(currentSchema, previousSchema){
        return SQL.toSQLUpdates(
            currentSchema.name, 
            currentSchema, 
            previousSchema, 
            this.options
        );
    }
    
    buildCreateStatement(schema, objects){
        return SQL.toSQLInsert(
            schema.name, 
            schema,
            objects,
            this.options
        );
    }
    
    buildReadStatement(schema, predicate){
        return SQL.toSQLRead(
            schema.name, 
            schema,
            predicate,
            this.options
        );
    }
    
    buildUpdateStatement(schema, objects){
        return SQL.toSQLUpdate(
            schema.name, 
            schema,
            objects,
            this.options
        );
    }
    
    buildDeleteStatement(schema, objectsOrIds){
        return SQL.toSQLDelete(
            schema.name, 
            schema,
            objectsOrIds,
            this.options
        );
    }
}