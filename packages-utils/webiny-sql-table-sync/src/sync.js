// @flow
import Log from "./log";
import type { LogType, SyncOptions } from "../types";

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
            this.logWarning("No tables provided.");
            return;
        }

        this.logInfo(`Sync process started, received ${tables.length} table(s) in total.`);

        for (let i = 0; i < this.options.tables.length; i++) {
            const table = new this.options.tables[i]();

            this.logInfo(`[${i + 1}/${this.options.tables.length}] Table "${table.getName()}".`, {
                table
            });

            const sql = await table.sync({ returnSQL: true });
            this.logInfo(`Generated SQL query: \n${sql}.`, { sql });

            if (this.options.execute) {
                try {
                    this.logInfo(`Executing...`);
                    await table.sync();
                    this.logSuccess("Done.");
                } catch (e) {
                    this.logError("Sync error!", e);
                }
            }
        }
    }

    logInfo(message: string = "", data: ?{}) {
        this.__log(message, "info", data);
    }

    logSuccess(message: string = "", data: ?{}) {
        this.__log(message, "success", data);
    }

    logWarning(message: string = "", data: ?{}) {
        this.__log(message, "warning", data);
    }

    logError(message: string = "", data: ?{}) {
        this.__log(message, "error", data);
    }

    getLog(): Array<Log> {
        return this.log;
    }

    getLogClass(): Class<Log> {
        return this.options.logClass;
    }

    __log(message: string = "", type: LogType, data: ?{}): Sync {
        const logClass = this.getLogClass();
        const log = new logClass(message, type, data);
        this.log.push(log);
        return this;
    }
}

export default Sync;
