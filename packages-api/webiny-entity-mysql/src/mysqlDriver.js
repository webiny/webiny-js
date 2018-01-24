// @flow
import _ from "lodash";
import { Entity, Driver, QueryResult } from "webiny-entity";
import queryBuilder from "webiny-sql-query-builder";
import { MySQLModel } from "./model";
import ConnectionClass from "mysql/lib/Connection";
import PoolClass from "mysql/lib/Pool";
import type { Connection, Pool } from "mysql";

declare type MySQLDriverOptions = {
    connection: Connection | Pool,
    model: Class<MySQLModel>,
    idGenerator: (entity: Entity, options: Object) => mixed,
    tables: {
        prefix: string,
        naming: ?Function
    }
};

class MySQLDriver extends Driver {
    connection: Connection | Pool;
    model: Class<MySQLModel>;
    idGenerator: Function;
    tables: {
        prefix: string,
        naming: ?Function
    };

    constructor(options: MySQLDriverOptions) {
        super();
        this.connection = options.connection;
        this.model = options.model || MySQLModel;

        this.idGenerator = options.idGenerator || null;

        this.tables = _.merge(
            {
                prefix: "",
                naming: null
            },
            options.tables
        );
    }

    onEntityConstruct(entity: Entity) {
        if (!(typeof this.idGenerator === "function")) {
            entity
                .attr("id")
                .integer()
                .setValidators("gt:0");
        }
    }

    getModelClass(): Class<MySQLModel> {
        return this.model;
    }

    async save(entity: Entity, options: Object): Promise<QueryResult> {
        const idGenerator = this.getIdGenerator();
        if (!entity.isExisting() && typeof idGenerator === "function") {
            entity.id = idGenerator(entity, options);
        }

        if (entity.isExisting()) {
            return new Promise(async (resolve, reject) => {
                const data = await entity.toStorage();
                const sql = queryBuilder.build({
                    operation: "update",
                    table: this.getTableName(entity),
                    data,
                    where: { id: data.id },
                    limit: 1
                });

                this.connection.query(sql, error => {
                    this.connection instanceof ConnectionClass && this.connection.end();
                    error ? reject(error) : resolve();
                });
            });
        }

        return new Promise(async (resolve, reject) => {
            const data = await entity.toStorage();
            const sql = queryBuilder.build({
                operation: "insert",
                data,
                table: this.getTableName(entity)
            });
            this.connection.query(sql, (error, results) => {
                this.connection instanceof ConnectionClass && this.connection.end();
                if (error) {
                    entity.id && entity.getAttribute("id").reset();
                    return reject(error);
                }

                if (!_.isFunction(this.getIdGenerator())) {
                    entity.id = results.insertId;
                }
                resolve();
            });
        });
    }

    // eslint-disable-next-line
    async delete(entity: Entity, options: Object): Promise<QueryResult> {
        return new Promise(async (resolve, reject) => {
            const id = await entity.getAttribute("id").getStorageValue();
            const sql = queryBuilder.build({
                operation: "delete",
                table: this.getTableName(entity),
                where: { id },
                limit: 1
            });

            this.connection.query(sql, error => {
                this.connection instanceof ConnectionClass && this.connection.end();
                // TODO: affected rows
                error ? reject(error) : resolve(new QueryResult(true, { affectedRows: 0 }));
            });
        });
    }

    async findOne(entity: Entity, options: Object): Promise<QueryResult> {
        return new Promise(async (resolve, reject) => {
            const sql = queryBuilder.build({
                operation: "select",
                table: this.getTableName(entity),
                where: options.query,
                limit: 1
            });

            this.connection.query(sql, (error, results) => {
                this.connection instanceof ConnectionClass && this.connection.end();
                error ? reject(error) : resolve(new QueryResult(results[0]));
            });
        });
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

    async find(entity: Entity, options: Object): Promise<QueryResult> {
        return new Promise(async (resolve, reject) => {
            const clonedOptions = _.merge({}, options, {
                table: this.getTableName(entity),
                operation: "select"
            });
            if (_.has(clonedOptions, "query")) {
                clonedOptions.where = clonedOptions.query;
                delete clonedOptions.query;
            }

            const sql = queryBuilder.build(clonedOptions);

            if (this.connection instanceof PoolClass) {
                return this.connection.getConnection((error, connection) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    connection.query(sql, (error, results) => {
                        if (error) {
                            connection.release();
                            return reject(error);
                        }

                        connection.query("SELECT FOUND_ROWS() as count", (error, result) => {
                            connection.release();
                            error
                                ? reject(error)
                                : resolve(new QueryResult(results, { count: result[0].count }));
                        });
                    });
                });
            }

            this.connection.query(sql, (error, results) => {
                if (error) {
                    this.connection.end();
                    return reject(error);
                }

                this.connection.query("SELECT FOUND_ROWS() as count", (err, result) => {
                    this.connection.end();
                    error
                        ? reject(error)
                        : resolve(new QueryResult(results, { count: result[0].count }));
                });
            });
        });
    }

    async count(entity: Entity, options: Object): Promise<QueryResult> {
        return new Promise(async (resolve, reject) => {
            const sql = queryBuilder.build(
                _.merge({}, options, { table: this.getTableName(entity), operation: "count" })
            );
            this.connection.query(sql, (error, results) => {
                this.connection instanceof ConnectionClass && this.connection.end();
                error ? reject(error) : resolve(new QueryResult(results[0].count));
            });
        });
    }

    // eslint-disable-next-line
    isId(entity: Entity, value: mixed, options: Object): boolean {
        if (typeof this.idGenerator === "function") {
            return typeof value === "string";
        }
        return typeof value === "number" && value > 0;
    }

    getConnection(): ConnectionClass | PoolClass {
        return this.connection;
    }

    setIdGenerator(idGenerator: Function): this {
        this.idGenerator = idGenerator;
        return this;
    }

    getIdGenerator(): ?Function {
        return this.idGenerator;
    }

    setTablePrefix(tablePrefix: string): this {
        this.tables.prefix = tablePrefix;
        return this;
    }

    getTablePrefix(): string {
        return this.tables.prefix;
    }

    setTableNaming(tableNameGenerator: Function): this {
        this.tables.naming = tableNameGenerator;
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
