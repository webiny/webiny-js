const _ = require('lodash');
const {operatorsProcessor} = require('./processors');
const SqlString = require('sqlstring');

class QueryBuilder {
    build(options) {
        if (_.isFunction(this[options.operation])) {
            return this[options.operation](options);
        }

        throw Error(`Unknown or missing operation (${options.operation}).`);
    }

    update(options) {
        const values = [];
        for (const [key, value] of Object.entries(options.data)) {
            values.push(key + ' = ' + SqlString.escape(value));
        }

        let operation = `UPDATE ${options.table} SET ${values.join(', ')}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    insert(options) {
        const columns = _.keys(options.data).join(', ');
        const insertValues = _.values(options.data).map(value => SqlString.escape(value)).join(', ');

        if (!options.onDuplicateKeyUpdate) {
        	return `INSERT INTO ${options.table} (${columns}) VALUES (${insertValues})`;
		}

		const updateValues = [];
		for (const [key, value] of Object.entries(options.data)) {
			updateValues.push(key + ' = ' + SqlString.escape(value));
		}

		return `INSERT INTO ${options.table} (${columns}) VALUES (${insertValues}) ON DUPLICATE KEY UPDATE ${updateValues.join(', ')}`;
    }

    select(options) {
        let operation = `SELECT`;
		operation += this._getColumns(options);
        operation += ` FROM ${options.table}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    delete(options) {
        let operation = `DELETE FROM ${options.table}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    count(options) {
        let operation = `SELECT COUNT(*) AS count FROM ${options.table}`;
        operation += this._getWhere(options);
        operation += this._getOrder(options);
        operation += this._getLimit(options);
        operation += this._getOffset(options);

        return operation;
    }

    _getColumns(options) {
        if (_.isEmpty(options.columns)) {
            return ' *';
        }

        return ' ' + options.columns.join(', ');
    }

    _getWhere(options) {
        if (_.isEmpty(options.where)) {
            return '';
        }

        return ' WHERE ' + operatorsProcessor.execute(options.where);
    }

    _getOrder(options) {
        if (_.isEmpty(options.order)) {
            return '';
        }

        let query = [];
        for (const [sort, order] of Object.entries(options.order)) {
            query.push(`${sort} ${order === 1 ? 'ASC' : 'DESC'}`);
        }

        return ' ORDER BY ' + query.join(', ');
    }

    _getLimit(options) {
        if (!_.isNumber(options.limit)) {
            return '';
        }
        return ` LIMIT ${options.limit}`;
    }

    _getOffset(options) {
        if (!_.isNumber(options.offset)) {
            return '';
        }
        return ` OFFSET ${options.offset}`;
    }
}

module.exports = new QueryBuilder();