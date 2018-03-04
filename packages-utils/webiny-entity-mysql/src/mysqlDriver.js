// @flow
import _ from "lodash";
import type { Connection, Pool } from "mysql";
import { Entity, Driver, QueryResult } from "webiny-entity";
import { MySQLConnection } from "webiny-mysql-connection";
import type {
    EntitySaveParams,
    EntityFindParams,
    EntityDeleteParams,
    EntityFindOneParams
} from "webiny-entity/types";
import type { Operator } from "./../types";

import { Insert, Update, Delete, Select } from "./statements";
import { MySQLModel } from "./model";
import operators from "./operators";
import { ArrayAttribute } from "webiny-model";

declare type MySQLDriverOptions = {
    connection: Connection | Pool,
    model: Class<MySQLModel>,
    operators: ?{ [string]: Operator },
    id: { attribute?: Function, value?: Function },
    tables: {
        prefix: string,
        naming: ?Function
    }
};

class MySQLDriver extends Driver {
    connection: MySQLConnection;
    model: Class<MySQLModel>;
    operators: { [string]: Operator };
    id: { validator: ?Function, value: ?Function };
    tables: {
        prefix: string,
        naming: ?Function
    };

    constructor(options: MySQLDriverOptions) {
        super();
        this.operators = { ...operators, ...options.operators };
        this.connection = new MySQLConnection(options.connection);
        this.model = options.model || MySQLModel;

        this.id = { validator: null, value: null };
        if (options.id) {
            this.id = _.merge(this.id, options.id);
        }

        this.tables = _.merge(
            {
                prefix: "",
                naming: null
            },
            options.tables
        );
    }

    setOperator(name: string, operator: Operator) {
        this.operators[name] = operator;
        return this;
    }

    onEntityConstruct(entity: Entity) {
        if (typeof this.id.value === "function") {
            entity.attr("id").char();
        } else {
            entity.attr("id").integer();
        }

        entity
            .getAttribute("id")
            .setValidators((value, attribute) =>
                this.isId(attribute.getParentModel().getParentEntity(), value)
            );
    }

    getModelClass(): Class<MySQLModel> {
        return this.model;
    }

    async save(entity: Entity, options: EntitySaveParams & {}): Promise<QueryResult> {
        if (!entity.isExisting() && typeof this.id.value === "function") {
            entity.id = this.id.value(entity, options);
        }

        if (entity.isExisting()) {
            const data = await entity.toStorage();
            const sql = new Update({
                operators: this.operators,
                table: this.getTableName(entity),
                data,
                where: { id: data.id },
                limit: 1
            }).generate();

            await this.getConnection().query(sql);
            return new QueryResult(true);
        }

        const data = await entity.toStorage();
        const sql = new Insert({
            operators: this.operators,
            data,
            table: this.getTableName(entity)
        }).generate();

        try {
            const results = await this.getConnection().query(sql);
            if (!_.isFunction(this.id.value)) {
                entity.id = results.insertId;
            }
        } catch (e) {
            entity.id && entity.getAttribute("id").reset();
            throw e;
        }

        return new QueryResult(true);
    }

    // eslint-disable-next-line
    async delete(entity: Entity, options: EntityDeleteParams & {}): Promise<QueryResult> {
        const id = await entity.getAttribute("id").getStorageValue();
        const sql = new Delete({
            operators: this.operators,
            table: this.getTableName(entity),
            where: { id },
            limit: 1
        }).generate();

        await this.getConnection().query(sql);
        return new QueryResult(true);
    }

    async find(
        entity: Entity | Class<Entity>,
        options: EntityFindParams & {}
    ): Promise<QueryResult> {
        const clonedOptions = _.merge({}, options, {
            operators: this.operators,
            table: this.getTableName(entity),
            operation: "select",
            limit: 10,
            offset: 0
        });

        const isScalar = v => /boolean|number|string/.test(typeof v);

        if (_.has(clonedOptions, "query")) {
            const where = {};
            const instance = typeof entity === "function" ? new entity() : entity;
            Object.keys(clonedOptions.query).map(key => {
                const value = clonedOptions.query[key];
                const attribute = instance.getAttribute(key);
                if (attribute instanceof ArrayAttribute) {
                    if (isScalar(value)) {
                        where[key] = { $jsonArrayFindValue: value };
                        return;
                    }

                    // Match all values (strict array equality check)
                    if (Array.isArray(value)) {
                        where[key] = { $jsonArrayStrictEquality: value };
                        return;
                    }

                    // Match any of the array values
                    if ("$in" in value) {
                        where["$or"] = value["$in"].map(v => ({
                            [key]: { $jsonArrayFindValue: v }
                        }));
                        return;
                    }

                    // Match all of the values (non-strict check)
                    if ("$all" in value) {
                        where["$and"] = value["$all"].map(v => ({
                            [key]: { $jsonArrayFindValue: v }
                        }));
                        return;
                    }
                }

                where[key] = value;
            });
            clonedOptions.where = where;
            delete clonedOptions.query;
        }

        if (_.has(clonedOptions, "perPage")) {
            clonedOptions.limit = clonedOptions.perPage;
            delete clonedOptions.perPage;
        }

        if (_.has(clonedOptions, "page")) {
            clonedOptions.offset = clonedOptions.limit * (clonedOptions.page - 1);
            delete clonedOptions.page;
        }

        const sql = new Select(clonedOptions).generate();
        const results = await this.getConnection().query([sql, "SELECT FOUND_ROWS() as count"]);

        return new QueryResult(results[0], { count: results[1][0].count });
    }

    async findOne(
        entity: Entity | Class<Entity>,
        options: EntityFindOneParams & {}
    ): Promise<QueryResult> {
        const sql = new Select({
            operators: this.operators,
            table: this.getTableName(entity),
            where: options.query,
            limit: 1
        }).generate();

        const results = await this.getConnection().query(sql);
        return new QueryResult(results[0]);
    }

    async count(
        entity: Entity | Class<Entity>,
        options: EntityFindParams & {}
    ): Promise<QueryResult> {
        const sql = new Select(
            _.merge({}, options, {
                operators: this.operators,
                table: this.getTableName(entity),
                columns: ["COUNT(*) AS count"]
            })
        );

        const results = await this.getConnection().query(sql);
        return new QueryResult(results[0].count);
    }

    // eslint-disable-next-line
    isId(entity: Entity | Class<Entity>, value: mixed, options: ?Object): boolean {
        if (typeof this.id.validator === "function") {
            return this.id.validator(entity, value, options);
        }
        return typeof value === "number" && value > 0;
    }

    getConnection(): MySQLConnection {
        return this.connection;
    }

    setTablePrefix(tablePrefix: string): this {
        this.tables.prefix = tablePrefix;
        return this;
    }

    getTablePrefix(): string {
        return this.tables.prefix;
    }

    setTableNaming(tableNameValue: Function): this {
        this.tables.naming = tableNameValue;
        return this;
    }

    getTableNaming(): ?Function {
        return this.tables.naming;
    }

    getTableName(entity: Entity): string {
        const isClass = typeof entity === "function";
        const params = {
            classId: isClass ? entity.classId : entity.constructor.classId,
            tableName: isClass ? entity.tableName : entity.constructor.tableName
        };

        const getTableName = this.getTableNaming();
        if (typeof getTableName === "function") {
            return getTableName({ entity, ...params, driver: this });
        }

        if (params.tableName) {
            return this.tables.prefix + params.tableName;
        }

        return this.tables.prefix + params.classId;
    }
}

export default MySQLDriver;
