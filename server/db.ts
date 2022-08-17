const { Pool } = require('pg');
import { parse } from 'pg-connection-string';
const { config } = require('./config');

const pool = new Pool(parse(config.db));

pool.on('error', (e: any, client: any) => {
    console.log(client, 'Something went wrong with the db connection', { err: e });
});

export async function dbExecuteAsyncQuery(query: string, params?: Array<any>) {
    const result = await pool.query(query, params);
    return result.rows;
}

function generateSqlColumnNameAndPlaceholderPairs(paramObject: Array<any>) {
    return Object.keys(paramObject)
        .reduce((accumulated, column, placeholderId) => `${accumulated} ${column} = $${placeholderId + 1},`, '')
        .slice(0, -1);
}

function generateSqlVariablePlaceholders(keys: Array<any>) {
    return keys
        .reduce(
            (accumulated: string, column: any, placeholderId: number) => `${accumulated} $${placeholderId + 1},`,
            ''
        )
        .slice(0, -1);
}

function generateUpdateQuery(table: string, paramObject: Array<any>) {
    let query = `UPDATE ${table} SET `;
    query += generateSqlColumnNameAndPlaceholderPairs(paramObject);
    query += ` WHERE id = $${Object.keys(paramObject).length + 1} RETURNING *`;
    return query;
}

function generateCreateQuery(table: string, paramObject: any) {
    const keys = Object.keys(paramObject);
    const fields = keys.reduce((acc, cur) => `${acc} ${cur},`, '').slice(0, -1);
    let query = `INSERT INTO ${table} (${fields})`;
    const placeHolders = generateSqlVariablePlaceholders(keys);
    query += ` VALUES (${placeHolders})`;
    query += ' RETURNING *';
    return query;
}

export function dbCreateRecord(table: string, paramObject: any) {
    const query = generateCreateQuery(table, paramObject);
    const values = Object.values(paramObject);
    return dbExecuteAsyncQuery(query, values).then((res) => res[0]);
}

export function dbUpdateRecord(table: string, paramObject: any) {
    const query = generateUpdateQuery(table, paramObject);
    const values = Object.values(paramObject);
    values.push(paramObject.id);
    return dbExecuteAsyncQuery(query, values).then((res) => res[0]);
}

export function dbFindId(table: string, id: string) {
    return dbExecuteAsyncQuery(`SELECT * FROM ${table} WHERE id = $1`, [id]).then((res) => res[0]);
}

export function dbDeleteById(table: string, id: number) {
    if (!id) {
        console.log(`Missing id when deleting from table ${table}`);
        return;
    }

    return dbExecuteAsyncQuery(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]).then((res) => {
        if (res.length > 1) {
            console.log({ id, table }, `${res.length} rows was deleted from table ${table} when deleting by id ${id}`);
        }
        return res;
    });
}

export function dbFindOne(table: string, paramObject: any) {
    const selectWithParams = Object.keys(paramObject).map((param, index) => `${param} = $${index + 1}`);
    return dbExecuteAsyncQuery(
        `SELECT * FROM ${table} WHERE ${selectWithParams.join(' AND ')}`,
        Object.values(paramObject)
    ).then((res) => res[0]);
}
