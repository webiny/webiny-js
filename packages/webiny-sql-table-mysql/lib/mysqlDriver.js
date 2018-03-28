"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _columnsContainer = require("./columnsContainer");

var _columnsContainer2 = _interopRequireDefault(_columnsContainer);

var _indexesContainer = require("./indexesContainer");

var _indexesContainer2 = _interopRequireDefault(_indexesContainer);

var _webinySqlTable = require("webiny-sql-table");

var _webinyMysqlConnection = require("webiny-mysql-connection");

var _sql = require("./sql");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class MySQLDriver extends _webinySqlTable.Driver {
    constructor(options = {}) {
        super();
        this.connection = null;
        options.connection && this.setConnection(options.connection);
    }

    getConnection() {
        return this.connection;
    }

    setConnection(connection) {
        this.connection = new _webinyMysqlConnection.MySQLConnection(connection);
        return this;
    }

    getColumnsClass() {
        return _columnsContainer2.default;
    }

    getIndexesClass() {
        return _indexesContainer2.default;
    }

    // eslint-disable-next-line
    create(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return (0, _sql.createTable)(table);
        })();
    }

    // eslint-disable-next-line
    alter(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return (0, _sql.alterTable)(table);
        })();
    }

    // eslint-disable-next-line
    drop(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return (0, _sql.dropTable)(table);
        })();
    }

    // eslint-disable-next-line
    truncate(table, options) {
        return (0, _asyncToGenerator3.default)(function*() {
            return (0, _sql.truncateTable)(table);
        })();
    }

    // eslint-disable-next-line
    sync(table, options) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const hasTable = yield _this.execute(`SHOW TABLES LIKE '${table.getName()}'`);
            if (hasTable.length) {
                // Table exist, we must alter the table.
                // const tableStructure = await this.execute(`DESCRIBE ${table.getName()}`);
                return "";
            }

            // Table does not exist, we can safely return SQL for new table creation create a new table.
            return _this.create(table, options);
        })();
    }

    execute(sql) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const connection = _this2.getConnection();
            if (connection instanceof _webinyMysqlConnection.MySQLConnection) {
                return yield connection.query(sql);
            }

            throw Error("MySQL connection not set.");
        })();
    }
}
exports.default = MySQLDriver;
//# sourceMappingURL=mysqlDriver.js.map
