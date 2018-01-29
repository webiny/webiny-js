// @flow
import _ from "lodash";
import { OperatorsProcessor } from "./processors";
import SqlString from "sqlstring";

const operatorsProcessor = new OperatorsProcessor();

class QueryBuilder {
    build(options: QueryOptions & { operation: string }): string {
        // The following line is a hack to make Flow happy when accessing methods dynamically
        const $this: Object = (this: Object);
        if (_.isFunction($this[options.operation])) {
            return $this[options.operation](options);
        }

        throw Error(`Unknown or missing operation (${options.operation}).`);
    }

    update(options: QueryOptions & { data: Object }): string {
        const values = [];
        for (const [key, value] of Object.entries(options.data)) {
            values.push(key + " = " + SqlString.escape(value));
        }

        let operation = `UPDATE ${options.table} SET ${values.join(", ")}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    insert(options: QueryOptions & { data: Object, onDuplicateKeyUpdate?: boolean }): string {
        const columns = _.keys(options.data).join(", ");
        const insertValues = _.values(options.data)
            .map(value => SqlString.escape(value))
            .join(", ");

        if (!options.onDuplicateKeyUpdate) {
            return `INSERT INTO ${options.table} (${columns}) VALUES (${insertValues})`;
        }

        const updateValues = [];
        for (const [key, value] of Object.entries(options.data)) {
            updateValues.push(key + " = " + SqlString.escape(value));
        }

        return `INSERT INTO ${
            options.table
        } (${columns}) VALUES (${insertValues}) ON DUPLICATE KEY UPDATE ${updateValues.join(", ")}`;
    }

    select(options: QueryOptions): string {
        let operation = `SELECT`;
        operation += this._getColumns(options);
        operation += ` FROM ${options.table}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    delete(options: QueryOptions): string {
        let operation = `DELETE FROM ${options.table}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    count(options: QueryOptions): string {
        let operation = `SELECT COUNT(*) AS count FROM ${options.table}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    _getColumns(options: { columns?: Array<string> }): string {
        const columns = options.columns || [];

        if (_.isEmpty(columns)) {
            return " *";
        }

        return " " + columns.join(", ");
    }

    _getWhere(options: { where?: Object }): string {
        if (_.isEmpty(options.where)) {
            return "";
        }

        return " WHERE " + operatorsProcessor.execute(options.where);
    }

    _getOrder(options: QueryOptions): string {
        if (!options.order || !options.order.length) {
            return "";
        }

        let query = [];

        options.order.forEach(order => {
            query.push(`${order[0]} ${order[1] === 1 ? "ASC" : "DESC"}`);
        });

        return " ORDER BY " + query.join(", ");
    }

    _getLimit(options: { limit?: number }): string {
        const limit = options.limit || 0;

        if (_.isNumber(limit) && limit > 0) {
            return ` LIMIT ${limit}`;
        }
        return "";
    }

    _getOffset(options: { offset?: number }): string {
        const offset = options.offset || 0;

        if (_.isNumber(offset) && offset > 0) {
            return ` OFFSET ${offset}`;
        }
        return "";
    }
}

export default QueryBuilder;
