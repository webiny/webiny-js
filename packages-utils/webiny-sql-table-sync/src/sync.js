// @flow
import Log from "./log";
import type { SyncOptions, LogOptions } from "../types";
import type { Table } from "webiny-sql-table";

class Sync {
    options: SyncOptions;
    log: Array<Log>;

    constructor(options: SyncOptions = {}) {
        this.options = options;
        if (!this.options.logClass) {
            this.options.logClass = Log;
        }
        this.log = [];
    }

    async execute() {
        const tables = this.options.tables;
        if (!tables || !tables.length) {
            this.logWarning({
                message: "No tables provided.",
                tags: ["noTables"]
            });
            return;
        }

        this.logInfo({
            message: `Sync process started, received ${tables.length} table(s) in total.`,
            tags: ["sync", "start"]
        });

        let errors = {
            count: 0
        };

        for (let i = 0; i < this.options.tables.length; i++) {
            const table = new this.options.tables[i]();

            this.logInfo({
                message: `[${i + 1}/${this.options.tables.length}] Table "${table.getName()}".`,
                data: { table },
                tags: ["table", "start"]
            });

            try {
                let sql = null;
                if (this.options.drop) {
                    sql = await table.drop({ returnSQL: true });
                    sql += "\n";
                    sql += await table.create({ returnSQL: true });
                } else {
                    sql = await table.sync({ returnSQL: true });
                }

                if (sql) {
                    this.logInfo({
                        message: sql,
                        tags: ["table", "sql", "generated"],
                        data: { sql }
                    });
                } else {
                    this.logInfo({
                        message: `Received empty SQL, proceeding.`,
                        tags: ["table", "sql", "generated", "empty"]
                    });
                    continue;
                }

                if (!this.options.preview) {
                    this.logInfo({
                        message: `Syncing table structure...`,
                        tags: ["table", "sql", "execute"]
                    });

                    if (this.options.drop) {
                        await table.drop();
                        await table.create();
                    } else {
                        await table.sync();
                    }
                    this.logSuccess({
                        message: "Sync complete.",
                        tags: ["table", "finish"]
                    });
                }
            } catch (e) {
                errors.count++;
                this.logError({
                    message: "Sync error: " + e,
                    data: { error: e }
                });
            }
        }

        if (!errors.count) {
            this.logSuccess({
                message: `Sync complete!`,
                tags: ["sync", "finish"]
            });
        } else {
            this.logError({
                message: `Sync completed with ${errors.count} error(s).`,
                data: { errors },
                tags: ["sync", "finish"]
            });
        }
    }

    getLog(): Array<Log> {
        return this.log;
    }

    getLogClass(): Class<Log> {
        return this.options.logClass;
    }

    getTables(): Array<Table> {
        return this.options.tables;
    }

    logInfo(params: LogOptions = {}) {
        const paramsClone = { ...params };
        if (paramsClone.tags) {
            paramsClone.tags.push("info");
        } else {
            paramsClone.tags = ["info"];
        }
        this.__log(paramsClone);
    }

    logWarning(params: LogOptions = {}) {
        const paramsClone = { ...params };
        if (paramsClone.tags) {
            paramsClone.tags.push("warning");
        } else {
            paramsClone.tags = ["warning"];
        }
        this.__log(paramsClone);
    }

    logError(params: LogOptions = {}) {
        const paramsClone = { ...params };
        if (paramsClone.tags) {
            paramsClone.tags.push("error");
        } else {
            paramsClone.tags = ["error"];
        }
        this.__log(paramsClone);
    }

    logSuccess(params: LogOptions = {}) {
        const paramsClone = { ...params };
        if (paramsClone.tags) {
            paramsClone.tags.push("success");
        } else {
            paramsClone.tags = ["success"];
        }
        this.__log(paramsClone);
    }

    __log(params: LogOptions = {}): Sync {
        const logClass = this.getLogClass();
        const log = new logClass(params.message, { ...params.data, sync: this }, params.tags);
        this.log.push(log);
        return this;
    }
}

export default Sync;
