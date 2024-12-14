"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Khipu = void 0;
var _sql = require("./sql.cjs");
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

class Khipu {
  constructor(options = {}) {
    this.options = options;
    if (!this.options.returnType) this.options.returnType = 'sql:string';
    const parts = this.options.returnType.split(':');
    this.mode = parts[0] || 'sql';
    this.output = parts[1] || 'string';
  }
  buildInitializationStatement(schema) {
    let query = null;
    //todo: work out escaping in functional mode
    if (this.mode === 'sql') {
      query = _sql.SQL.toSQL(schema.name, schema, this.options);
    }
    if (this.output === 'string') {
      return query;
    }
  }
  buildMigrationStatement(currentSchema, previousSchema) {
    return _sql.SQL.toSQLUpdates(currentSchema.name, currentSchema, previousSchema, this.options);
  }
  buildCreateStatement(schema, objects) {
    return _sql.SQL.toSQLInsert(schema.name, schema, objects, this.options);
  }
  buildReadStatement(schema, predicate) {}
  buildUpdateStatement(schema, objects) {
    return _sql.SQL.toSQLUpdate(schema.name, schema, objects, this.options);
  }
  buildDeleteStatement(schema, objectsOrIds) {
    return _sql.SQL.toSQLDelete(schema.name, schema, objectsOrIds, this.options);
  }
}
exports.Khipu = Khipu;