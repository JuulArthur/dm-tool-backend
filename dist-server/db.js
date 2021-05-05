"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Pool } = require('pg');
const pool = new Pool();
pool.on('error', (e, client) => {
    console.log(client, 'Something went wrong with the db connection', { err: e });
});
function execute(query, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pool.query(query, params);
        return result.rows;
    });
}
function generateSqlColumnNameAndPlaceholderPairs(paramObject) {
    return Object.keys(paramObject)
        .reduce((accumulated, column, placeholderId) => `${accumulated} ${column} = $${placeholderId + 1},`, '')
        .slice(0, -1);
}
function generateSqlVariablePlaceholders(keys) {
    return keys
        .reduce((accumulated, column, placeholderId) => `${accumulated} $${placeholderId + 1},`, '')
        .slice(0, -1);
}
function generateUpdateQuery(table, paramObject) {
    let query = `UPDATE ${table} SET `;
    query += generateSqlColumnNameAndPlaceholderPairs(paramObject);
    query += ` WHERE id = $${Object.keys(paramObject).length + 1} RETURNING *`;
    return query;
}
function generateCreateQuery(table, paramObject) {
    const keys = Object.keys(paramObject);
    const fields = keys.reduce((acc, cur) => `${acc} ${cur},`, '').slice(0, -1);
    let query = `INSERT INTO ${table} (${fields})`;
    const placeHolders = generateSqlVariablePlaceholders(keys);
    query += ` VALUES (${placeHolders})`;
    query += ' RETURNING *';
    return query;
}
function dbCreateRecord(table, paramObject) {
    const query = generateCreateQuery(table, paramObject);
    const values = Object.values(paramObject);
    return execute(query, values).then((res) => res[0]);
}
exports.dbCreateRecord = dbCreateRecord;
function dbUpdateRecord(table, paramObject) {
    const query = generateUpdateQuery(table, paramObject);
    const values = Object.values(paramObject);
    values.push(paramObject.id);
    return execute(query, values).then((res) => res[0]);
}
exports.dbUpdateRecord = dbUpdateRecord;
function dbFindId(table, id) {
    return execute(`SELECT * FROM ${table} WHERE id = $1`, [id]).then((res) => res[0]);
}
exports.dbFindId = dbFindId;
function dbDeleteById(table, id) {
    if (!id) {
        console.log(`Missing id when deleting from table ${table}`);
        return;
    }
    return execute(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]).then((res) => {
        if (res.length > 1) {
            console.log({ id, table }, `${res.length} rows was deleted from table ${table} when deleting by id ${id}`);
        }
        return res;
    });
}
exports.dbDeleteById = dbDeleteById;
function dbFindOne(table, paramObject) {
    const selectWithParams = Object.keys(paramObject).map((param, index) => `${param} = $${index + 1}`);
    return execute(`SELECT * FROM ${table} WHERE ${selectWithParams.join(' AND ')}`, Object.values(paramObject)).then((res) => res[0]);
}
exports.dbFindOne = dbFindOne;
//# sourceMappingURL=db.js.map