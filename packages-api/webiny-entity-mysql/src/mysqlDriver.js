// @flow
import _ from "lodash";
import { Entity, Driver, QueryResult } from "webiny-entity";
import queryBuilder from "webiny-sql-query-builder";
import { MySQLModel } from "./model";
import type { Connection, Pool } from "mysql";
import MySQLConnection from "./mysqlConnection";

declare type MySQLDriverOptions = {
    connection: Connection | Pool,
    model: Class<MySQLModel>,
    id: { attribute?: Function, value?: Function },
    tables: {
        prefix: string,
        naming: ?Function
    }
};

class MySQLDriver extends Driver {
    connection: MySQLConnection;
    model: Class<MySQLModel>;
    id: { validator: ?Function, value: ?Function };
    tables: {
        prefix: string,
        naming: ?Function
    };

    constructor(options: MySQLDriverOptions) {
        super();
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

    async save(entity: Entity, options: Object): Promise<QueryResult> {
        if (!entity.isExisting() && typeof this.id.value === "function") {
            entity.id = this.id.value(entity, options);
        }

        if (entity.isExisting()) {
            const data = await entity.toStorage();
            const sql = queryBuilder.build({
                operation: "update",
                table: this.getTableName(entity),
                data,
                where: { id: data.id },
                limit: 1
            });

            return this.getConnection().query(sql);
        }

        const data = await entity.toStorage();
        const sql = queryBuilder.build({
            operation: "insert",
            data,
            table: this.getTableName(entity)
        });

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
    async delete(entity: Entity, options: Object): Promise<QueryResult> {
        const id = await entity.getAttribute("id").getStorageValue();
        const sql = queryBuilder.build({
            operation: "delete",
            table: this.getTableName(entity),
            where: { id },
            limit: 1
        });

        await this.getConnection().query(sql);
        return new QueryResult(true);
    }

    async find(entity: Entity, options: Object): Promise<QueryResult> {
        const clonedOptions = _.merge({}, options, {
            table: this.getTableName(entity),
            operation: "select"
        });

        if (_.has(clonedOptions, "query")) {
            clonedOptions.where = clonedOptions.query;
            delete clonedOptions.query;
        }

        const sql = queryBuilder.build(clonedOptions);

        const results = await this.getConnection().query([sql, "SELECT FOUND_ROWS() as count"]);

        return new QueryResult(results[0], results[1][0].count);
    }

    async findOne(entity: Entity, options: Object): Promise<QueryResult> {
        const sql = queryBuilder.build({
            operation: "select",
            table: this.getTableName(entity),
            where: options.query,
            limit: 1
        });

        const results = await this.getConnection().query(sql);
        return new QueryResult(results[0]);
    }

    // eslint-disable-next-line
    async findById(entity: Entity, id: mixed, options: Object): Promise<QueryResult> {
        return this.findOne(entity, { table: this.getTableName(entity), where: { id } });
    }

    async findByIds(entity: Entity, ids: Array<mixed>, options: Object): Promise<QueryResult> {
        const cloned = _.cloneDeep(options);
        cloned.where = { id: ids };
        return this.find(entity, cloned);
    }

    async count(entity: Entity, options: Object): Promise<QueryResult> {
        const sql = queryBuilder.build(
            _.merge({}, options, { table: this.getTableName(entity), operation: "count" })
        );

        const results = await this.getConnection().query(sql);
        return new QueryResult(results[0].count);
    }

    // eslint-disable-next-line
    isId(entity: Entity, value: mixed, options: ?Object): boolean {
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
