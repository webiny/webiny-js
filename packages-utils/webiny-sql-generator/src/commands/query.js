// @flow
import SqlString from "sqlstring";
import _ from "lodash";
import { operatorsProcessor } from "./processors";

class Query {
    options: {};
    constructor(options: {} = {}) {
        this.options = options;
    }

    generate(): string {
        return "";
    }

    getColumns(options: { columns?: Array<string> }): string {
        const columns = options.columns || [];

        if (_.isEmpty(columns)) {
            return " *";
        }

        return " " + columns.join(", ");
    }

    getWhere(options: { where?: Object }): string {
        if (_.isEmpty(options.where)) {
            return "";
        }

        return " WHERE " + operatorsProcessor.execute(options.where);
    }

    getOrder(options: { order?: Array<OrderTuple> }): string {
        if (!options.order || !options.order.length) {
            return "";
        }

        let query = [];

        options.order.forEach(order => {
            query.push(`${order[0]} ${order[1] === 1 ? "ASC" : "DESC"}`);
        });

        return " ORDER BY " + query.join(", ");
    }

    getLimit(options: { limit?: number }): string {
        const limit = options.limit || 0;

        if (_.isNumber(limit) && limit > 0) {
            return ` LIMIT ${limit}`;
        }
        return "";
    }

    getOffset(options: { offset?: number }): string {
        const offset = options.offset || 0;

        if (_.isNumber(offset) && offset > 0) {
            return ` OFFSET ${offset}`;
        }
        return "";
    }

    escape(value: mixed) {
        return SqlString.escape(value);
    }
}

export default Query;
