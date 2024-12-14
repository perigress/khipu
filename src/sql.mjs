import { hash } from '@environment-safe/object-hash';

const sqlType = (jsonType, pattern, opts)=>{
    switch(jsonType){
        case 'string': return 'VARCHAR(255)';
        case 'number': return 'FLOAT(24)';
        //case 'object': return 'varchar(255)'; //currently unsupported
        case 'integer': return 'INTEGER';
        //case 'array': return 'varchar(255)'; //currently unsupported
        case 'boolean': return 'BOOLEAN';
        default: throw new Error('Unknown type: '+jsonType);
    }
};

const literalValue = (value, escape)=>{
    switch(typeof value){
        case 'number' : return value.toString();
        case 'string' : return `"${escape?escape(value):value}"`;
        case 'boolean' : return value.toString();
        default : return value.toString();
    }
};

const queryDocumentPredicateToSQLPredicate = (query, options={})=>{
    if(query['$or']){
        return query['$or'].map((phrase)=>{
            return queryDocumentPredicateToSQLPredicate(phrase);
        }).join(' OR ');
    }
    const fields = Object.keys(query);
    let field = null;
    const phrases = [];
    for(let lcv=0; lcv < fields.length; lcv++){
        field = fields[lcv];
        const keys = Object.keys(query[field]);
        keys.map((key)=>{
            switch(key){
                case '$in': 
                    phrases.push(
                        `${ field } IN ( ${query[field][key].map((value)=>{
                            literalValue(value, options.escape);
                        })} )`
                    );
                    break;
                case '$eq': 
                    phrases.push(`${ field } == ${ 
                        literalValue(query[field][key], options.escape) 
                    }`);
                    break;
                case '$ne': 
                    phrases.push(`${ field } <> ${ 
                        literalValue(query[field][key], options.escape) 
                    }`);
                    break;
                case '$gt': 
                    phrases.push(`${ field } > ${ 
                        literalValue(query[field][key], options.escape) 
                    }`);
                    break;
                case '$lt': 
                    phrases.push(`${ field } < ${ 
                        literalValue(query[field][key], options.escape) 
                    }`);
                    break;
                case '$gte': 
                    phrases.push(`${ field } >= ${ 
                        literalValue(query[field][key], options.escape) 
                    }`);
                    break;
                case '$lte': 
                    phrases.push(`${ field } <= ${ 
                        literalValue(query[field][key], options.escape) 
                    }`);
                    break;
            }
        });
    }
    return phrases.join(' AND ');
};

const fieldSQL = (f)=>{
    let field = f || {};
    return `${field.name} ${ field.sqlType }${(field.canBeNull?'':' NOT NULL')}`;
};

const sqlAddUpdate = (table, f)=>{
    let field = f || {};
    return {
        up: `ALTER TABLE ${table} ADD ${fieldSQL(field)}`,
        down: `ALTER TABLE ${table} DROP ${field.name}`
    };
};

const sqlDeleteUpdate = (table, f)=>{
    let field = f || {};
    let inverted = sqlAddUpdate(table, field);
    return {
        up : inverted.down,
        down: inverted.up
    };
};

export const SQL = {
    toSQLParts : (name, schema, opts)=>{
        return {
            name: name,
            fields : Object.keys(schema.properties).map((property)=>{
                return {
                    name : property,
                    sqlType : sqlType(
                        schema.properties[property].type,
                        schema.properties[property].pattern,
                        opts
                    ),
                    jsonType : schema.properties[property].type,
                    canBeNull : (schema.required||[]).indexOf(property)==-1
                };
            })
        };
    },
    toSQL : async (name, schema, opts)=>{
        let options = opts || {};
        let table = SQL.toSQLParts(name, schema, opts);
        let serializeKeyword = 'SERIAL';
        let relations = [];
        return [`CREATE TABLE "${table.name}"(\n    ${
            table.fields.map((field)=>{
                let isPrimaryKey = (options.primaryKey && field.name === options.primaryKey);

                let isForeignKey = (
                    options.foreignKey &&
                    options.foreignKey(name, field.name, '::')
                );
                if(['pg', 'postgress', 'postgresql'].indexOf(opts.dialect) !== -1){
                    if(isForeignKey){
                        if(['pg', 'postgress', 'postgresql'].indexOf(opts.dialect) !== -1){
                            return `"${field.name}" ${ field.sqlType } REFERENCES ${
                                isForeignKey.type
                            }(${
                                options.primaryKey
                            })`;
                        }
                        return `"${field.name}" ${ field.sqlType }${
                            (isPrimaryKey)?' PRIMARY KEY':''
                        }${
                            (isPrimaryKey && options.serial)?' '+serializeKeyword:''
                        }${
                            (field.canBeNull?'':' NOT NULL')
                        }`;
                    }
                }else{
                    serializeKeyword = 'AUTO INCREMENT';
                    if(isPrimaryKey){
                        relations.push(`PRIMARY KEY(${field.name})`);
                    }
                    if(isForeignKey){
                        relations.push(`FOREIGN KEY(${field.name}) REFERENCES ${
                            isForeignKey.type
                        }(${
                            options.primaryKey
                        })`);
                    }
                    return `"${field.name}" ${ field.sqlType }${
                        (field.canBeNull?'':' NOT NULL')
                    }${
                        (isPrimaryKey && options.serial)?' '+serializeKeyword:''
                    }`;
                }
            }).concat(relations).join(',\n    ')+'\n'
        })`];
    },
    toSQLUpdates : async (name, schemaNew, schemaOld, opts)=>{
        let newTable = SQL.toSQLParts(name, schemaNew, opts);
        let oldTable = SQL.toSQLParts(name, schemaOld, opts);
        let ups = [];
        let downs = [];
        let newField = null;
        let oldField = null;
        for(
            let newFieldIndex = 0; 
            newFieldIndex <  newTable.fields.length; 
            newFieldIndex++
        ){
            newField = newTable.fields[newFieldIndex];
            let found = false;
            let newHash = await hash(newField);
            for(
                let oldFieldIndex = 0; 
                oldFieldIndex <  oldTable.fields.length; 
                oldFieldIndex++
            ){
                oldField = oldTable.fields[oldFieldIndex];
                let oldHash = await hash(oldField);
                if(newHash === oldHash){
                    found = true;
                }
            }
            if(!found){
                let update = sqlAddUpdate(name, newField);
                ups.push(update.up);
                downs.push(update.down);
            }
        }
        for(
            let oldFieldIndex = 0; 
            oldFieldIndex <  oldTable.fields.length; 
            oldFieldIndex++
        ){
            oldField = oldTable.fields[oldFieldIndex];
            let found = false;
            let oldHash = await hash(oldField);
            for(
                let newFieldIndex = 0; 
                newFieldIndex <  newTable.fields.length; 
                newFieldIndex++
            ){
                newField = newTable.fields[newFieldIndex];
                let newHash = await hash(newField);
                if(newHash === oldHash){
                    found = true;
                }
            }
            if(!found){
                let update = sqlDeleteUpdate(name, oldField);
                ups.push(update.up);
                downs.push(update.down);
            }
        }
        return {
            ups, downs
        };
    },
    toSQLInsert : async (name, schema, itms, options)=>{
        let items = Array.isArray(itms)?itms:[itms];
        if(!items.length) throw new Error('must have items to create insert');
        return [`INSERT INTO ${name}(${
            Object.keys(items[0]).join(', ')
        }) VALUES ${
            items.map(
                i=>'('+Object.keys(i).map(
                    key => literalValue(i[key], options.escape)
                ).join(', ')+')'
            ).join(', ')
        }`];
    },
    toSQLUpdate : async (name, schema, itms, options)=>{
        let items = Array.isArray(itms)?itms:[itms];
        let idField = options.id || options.identifier || 'id';
        if(!items.length) throw new Error('must have items to create update');
        const results = [];
        let item = null;
        let nonIdKeys = null;
        let sql = null;
        for(let lcv=0; lcv < items.length; lcv++){
            item = items[lcv];
            nonIdKeys = Object.keys(item).filter((key)=> key !== idField);
            sql = `UPDATE ${ name } SET ${
                nonIdKeys.map((key)=>{
                    return `${key} = ${
                        literalValue(item[key], options.escape)
                    }`;
                }).join(', ')
            } WHERE ${idField} = ${
                literalValue(item[idField], options.escape)
            }`;
            results.push(sql);
        }
        return results;
    },
    toSQLRead : async (name, schema, query, options)=>{
        const sql = `SELECT ${
            Object.keys(schema.properties).map((key)=>{
                return key;
            }).join(', ')
        } FROM ${name} WHERE ${
            queryDocumentPredicateToSQLPredicate(query)
        }`;
        return [sql];
    },
    toSQLDelete : async (name, schema, itms, options)=>{
        let items = Array.isArray(itms)?itms:[itms];
        let idField = options.id || options.identifier || 'id';
        if(!items.length) throw new Error('must have items to create update');
        const ids = typeof items[0] === 'object'?items.map((item)=>{
            return item[idField];
        }):items;
        return [`DELETE FROM ${name} WHERE ${idField} IN (${ ids.map((v)=>{
            return literalValue(v, options.escape);
        }).join(', ') })`];
    },
    
    wrapExecution : ()=>{
        
    }
};