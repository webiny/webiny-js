"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _log = require("./log");

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Sync {
    constructor(options = {}) {
        this.options = options;
        if (!this.options.logClass) {
            this.options.logClass = _log2.default;
        }
        this.log = [];
    }

    execute() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const tables = _this.options.tables;
            if (!tables || !tables.length) {
                _this.logWarning({
                    message: "No tables provided.",
                    tags: ["noTables"]
                });
                return;
            }

            _this.logInfo({
                message: `Sync process started, received ${tables.length} table(s) in total.`,
                tags: ["sync", "start"]
            });

            let errors = {
                count: 0
            };

            for (let i = 0; i < _this.options.tables.length; i++) {
                const table = new _this.options.tables[i]();

                _this.logInfo({
                    message: `[${i + 1}/${
                        _this.options.tables.length
                    }] Table "${table.getName()}".`,
                    data: { table },
                    tags: ["table", "start"]
                });

                try {
                    let sql = null;
                    if (_this.options.drop) {
                        sql = yield table.drop({ returnSQL: true });
                        sql += "\n";
                        sql += yield table.create({ returnSQL: true });
                    } else {
                        sql = yield table.sync({ returnSQL: true });
                    }

                    if (sql) {
                        _this.logInfo({
                            message: sql,
                            tags: ["table", "sql", "generated"],
                            data: { sql }
                        });
                    } else {
                        _this.logInfo({
                            message: `Received empty SQL, proceeding.`,
                            tags: ["table", "sql", "generated", "empty"]
                        });
                        continue;
                    }

                    if (!_this.options.preview) {
                        _this.logInfo({
                            message: `Syncing table structure...`,
                            tags: ["table", "sql", "execute"]
                        });

                        if (_this.options.drop) {
                            yield table.drop();
                            yield table.create();
                        } else {
                            yield table.sync();
                        }
                        _this.logSuccess({
                            message: "Sync complete.",
                            tags: ["table", "finish"]
                        });
                    }
                } catch (e) {
                    errors.count++;
                    _this.logError({
                        message: "Sync error: " + e,
                        data: { error: e }
                    });
                }
            }

            if (!errors.count) {
                _this.logSuccess({
                    message: `Sync complete!`,
                    tags: ["sync", "finish"]
                });
            } else {
                _this.logError({
                    message: `Sync completed with ${errors.count} error(s).`,
                    data: { errors },
                    tags: ["sync", "finish"]
                });
            }
        })();
    }

    getLog() {
        return this.log;
    }

    getLogClass() {
        return this.options.logClass;
    }

    getTables() {
        return this.options.tables;
    }

    logInfo(params = {}) {
        const paramsClone = (0, _assign2.default)({}, params);
        if (paramsClone.tags) {
            paramsClone.tags.push("info");
        } else {
            paramsClone.tags = ["info"];
        }
        this.__log(paramsClone);
    }

    logWarning(params = {}) {
        const paramsClone = (0, _assign2.default)({}, params);
        if (paramsClone.tags) {
            paramsClone.tags.push("warning");
        } else {
            paramsClone.tags = ["warning"];
        }
        this.__log(paramsClone);
    }

    logError(params = {}) {
        const paramsClone = (0, _assign2.default)({}, params);
        if (paramsClone.tags) {
            paramsClone.tags.push("error");
        } else {
            paramsClone.tags = ["error"];
        }
        this.__log(paramsClone);
    }

    logSuccess(params = {}) {
        const paramsClone = (0, _assign2.default)({}, params);
        if (paramsClone.tags) {
            paramsClone.tags.push("success");
        } else {
            paramsClone.tags = ["success"];
        }
        this.__log(paramsClone);
    }

    __log(params = {}) {
        const logClass = this.getLogClass();
        const log = new logClass(
            params.message,
            (0, _assign2.default)({}, params.data, { sync: this }),
            params.tags
        );
        this.log.push(log);
        return this;
    }
}
exports.default = Sync;
//# sourceMappingURL=sync.js.map
