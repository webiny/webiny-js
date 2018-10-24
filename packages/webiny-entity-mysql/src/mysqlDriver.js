// @flow
import _ from "lodash";
import mdbid from "mdbid";
import type { Connection, Pool } from "mysql";
import { Entity, Driver, QueryResult } from "webiny-entity";
import { MySQLConnection } from "webiny-mysql-connection";
import { Attribute } from "webiny-model";
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

declare type MySQLDriverOptions = {
    connection: Connection | Pool,
    model?: Class<MySQLModel>,
    operators?: { [string]: Operator },
    tables?: {
        prefix: string,
        naming: ?Function
    },
    autoIncrementIds?: boolean
};

class MySQLDriver extends Driver {
    connection: MySQLConnection;
    model: Class<MySQLModel>;
    operators: { [string]: Operator };
    tables: {
        prefix: string,
        naming: ?Function
    };
    autoIncrementIds: boolean;
    constructor(options: MySQLDriverOptions) {
        super();
        this.operators = { ...operators, ...(options.operators || {}) };
        this.connection = new MySQLConnection(options.connection);
        this.model = options.model || MySQLModel;

        this.tables = {
            prefix: "",
            ...(options.tables || {})
        };
        this.autoIncrementIds = options.autoIncrementIds || false;
    }

    setOperator(name: string, operator: Operator) {
        this.operators[name] = operator;
        return this;
    }

    onEntityConstruct(entity: Entity) {
        if (this.autoIncrementIds) {
            entity
                .attr("id")
                .integer()
                .setValidators((value, attribute) =>
                    this.isId(attribute.getParentModel().getParentEntity(), value)
                );
        } else {
            entity
                .attr("id")
                .char()
                .setValidators((value, attribute) =>
                    this.isId(attribute.getParentModel().getParentEntity(), value)
                );
        }
    }

    getModelClass(): Class<MySQLModel> {
        return this.model;
    }

    // eslint-disable-next-line
    async save(entity: Entity, options: EntitySaveParams & {}): Promise<QueryResult> {
        if (entity.isExisting()) {
            const data = await entity.toStorage();
            if (_.isEmpty(data)) {
                return new QueryResult(true);
            }

            const sql = new Update(
                {
                    operators: this.operators,
                    table: this.getTableName(entity),
                    data,
                    where: { id: entity.id },
                    limit: 1
                },
                entity
            ).generate();

            await this.getConnection().query(sql);
            return new QueryResult(true);
        }

        if (!this.autoIncrementIds) {
            entity.id = MySQLDriver.__generateID();
        }

        const data = await entity.toStorage();
        const sql = new Insert(
            {
                operators: this.operators,
                data,
                table: this.getTableName(entity)
            },
            entity
        ).generate();

        try {
            const results = await this.getConnection().query(sql);
            if (this.autoIncrementIds) {
                entity.id = results.insertId;
            }
        } catch (e) {
            const idAttribute: Attribute = (entity.getAttribute("id"): any);
            idAttribute.reset();
            throw e;
        }

        return new QueryResult(true);
    }

    // eslint-disable-next-line
    async delete(entity: Entity, options: EntityDeleteParams & {}): Promise<QueryResult> {
        const sql = new Delete(
            {
                operators: this.operators,
                table: this.getTableName(entity),
                where: { id: entity.id },
                limit: 1
            },
            entity
        ).generate();

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

        MySQLDriver.__preparePerPageOption(clonedOptions);
        MySQLDriver.__preparePageOption(clonedOptions);
        MySQLDriver.__prepareQueryOption(clonedOptions);
        MySQLDriver.__prepareSearchOption(clonedOptions);

        clonedOptions.calculateFoundRows = true;

        const sql = new Select(clonedOptions, entity).generate();
        const results = await this.getConnection().query([sql, "SELECT FOUND_ROWS() as count"]);

        return new QueryResult(results[0], { totalCount: results[1][0].count });
    }

    async findOne(
        entity: Entity | Class<Entity>,
        options: EntityFindOneParams & {}
    ): Promise<QueryResult> {
        const clonedOptions = {
            operators: this.operators,
            table: this.getTableName(entity),
            where: options.query,
            search: options.search,
            groupBy: options.groupBy,
            sort: options.sort,
            page: options.page,
            limit: 1
        };

        MySQLDriver.__preparePerPageOption(clonedOptions);
        MySQLDriver.__preparePageOption(clonedOptions);
        MySQLDriver.__prepareQueryOption(clonedOptions);
        MySQLDriver.__prepareSearchOption(clonedOptions);

        const sql = new Select(clonedOptions, entity).generate();

        const results = await this.getConnection().query(sql);
        return new QueryResult(results[0]);
    }

    async count(
        entity: Entity | Class<Entity>,
        options: EntityFindParams & {}
    ): Promise<QueryResult> {
        const clonedOptions = _.merge(
            {},
            options,
            {
                operators: this.operators,
                table: this.getTableName(entity),
                columns: ["COUNT(*) AS count"]
            },
            entity
        );

        MySQLDriver.__prepareQueryOption(clonedOptions);
        MySQLDriver.__prepareSearchOption(clonedOptions);

        const sql = new Select(clonedOptions, entity).generate();

        const results = await this.getConnection().query(sql);
        return new QueryResult(results[0].count);
    }

    // eslint-disable-next-line
    isId(entity: Entity | Class<Entity>, value: mixed, options: ?Object): boolean {
        if (this.autoIncrementIds) {
            return typeof value === "number" && Number.isInteger(value) && value > 0;
        }

        if (typeof value === "string") {
            return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
        }
        return false;
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

    getTableName(entity: Entity | Class<Entity>): string {
        const params = {
            classId: _.get(entity, "constructor.classId", _.get(entity, "classId")),
            storageClassId: _.get(
                entity,
                "constructor.storageClassId",
                _.get(entity, "storageClassId")
            ),
            tableName: _.get(entity, "constructor.tableName", _.get(entity, "tableName"))
        };

        const getTableName = this.getTableNaming();
        if (typeof getTableName === "function") {
            return getTableName({ entity, ...params, driver: this });
        }

        if (params.tableName) {
            return this.tables.prefix + params.tableName;
        }

        return (
            this.tables.prefix + (params.storageClassId ? params.storageClassId : params.classId)
        );
    }

    async test() {
        await this.getConnection().test();
        return true;
    }

    static __preparePerPageOption(clonedOptions: Object): void {
        if ("perPage" in clonedOptions) {
            clonedOptions.limit = clonedOptions.perPage;
            delete clonedOptions.perPage;
        }
    }

    static __preparePageOption(clonedOptions: Object): void {
        if ("page" in clonedOptions) {
            clonedOptions.offset = clonedOptions.limit * (clonedOptions.page - 1);
            delete clonedOptions.page;
        }
    }

    static __prepareQueryOption(clonedOptions: Object): void {
        if (clonedOptions.query instanceof Object) {
            clonedOptions.where = clonedOptions.query;
            delete clonedOptions.query;
        }
    }

    static __prepareSearchOption(clonedOptions: Object): void {
        // Here we handle search (if passed) - we transform received arguments into linked LIKE statements.
        if (clonedOptions.search instanceof Object) {
            const { query, operator, fields: columns } = clonedOptions.search;
            const search = { $search: { operator, columns, query } };

            if (clonedOptions.where instanceof Object) {
                clonedOptions.where = {
                    $and: [search, clonedOptions.where]
                };
            } else {
                clonedOptions.where = search;
            }

            delete clonedOptions.search;
        }
    }

    static __generateID() {
        return mdbid();
    }
}

export default MySQLDriver;
