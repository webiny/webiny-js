// @flow
import SqlString from "sqlstring";
import _ from "lodash";
import type { Entity } from "webiny-entity";
import type { Operator, Payload } from "../../types";

declare type StatementOptions = {
    operators: { [string]: Operator },
    calculateFoundRows: boolean,
    table: string,
    data: Object,
    limit?: number,
    offset?: number,
    groupBy?: Array<string>,
    sort?: string,
    where?: Object,
    columns?: Array<string>,
    onDuplicateKeyUpdate?: boolean
};

class Statement {
    entity: Entity | Class<Entity>;
    options: StatementOptions;
    constructor(options: Object = {}, entity: Entity | Class<Entity>) {
        this.options = options;
        this.entity = entity;
    }

    generate(): string {
        return "";
    }

    getColumns(options: StatementOptions): string {
        const columns = options.columns || [];

        if (_.isEmpty(columns)) {
            return " *";
        }

        return " " + columns.join(", ");
    }

    getWhere(options: StatementOptions): string {
        if (_.isEmpty(options.where)) {
            return "";
        }

        return " WHERE " + this.process({ $and: options.where });
    }

    getGroup(options: StatementOptions): string {
        if (!(Array.isArray(options.groupBy) && options.groupBy.length > 0)) {
            return "";
        }

        return " GROUP BY " + options.groupBy.join(", ");
    }

    getOrder(options: StatementOptions): string {
        if (!(options.sort instanceof Object) || _.isEmpty(options.sort)) {
            return "";
        }

        let query = [];

        for (let key in options.sort) {
            query.push(`${key} ${options.sort[key] === 1 ? "ASC" : "DESC"}`);
        }

        return " ORDER BY " + query.join(", ");
    }

    getLimit(options: StatementOptions): string {
        const limit = options.limit || 0;

        if (_.isNumber(limit) && limit > 0) {
            return ` LIMIT ${limit}`;
        }
        return "";
    }

    getOffset(options: StatementOptions): string {
        const offset = options.offset || 0;

        if (_.isNumber(offset) && offset > 0) {
            return ` OFFSET ${offset}`;
        }
        return "";
    }

    escape(value: mixed) {
        return SqlString.escape(value);
    }

    /**
     * Traverse the payload and apply operators to construct a valid MySQL statement
     * @private
     * @param {Object} payload
     * @returns {string} SQL query
     */
    process(payload: Payload): string {
        let output = "";

        outerLoop: for (const [key, value] of Object.entries(payload)) {
            const operators: Array<Operator> = Object.values(this.options.operators);
            for (let i = 0; i < operators.length; i++) {
                const operator = operators[i];
                if (operator.canProcess({ key, value, statement: this })) {
                    output += operator.process({ key, value, statement: this });
                    continue outerLoop;
                }
            }
            throw new Error(`Invalid operator {${key} : ${(value: any)}}.`);
        }

        return output;
    }
}

export default Statement;
