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

var _column = require("./column");

var _column2 = _interopRequireDefault(_column);

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

var _driver = require("./driver");

var _driver2 = _interopRequireDefault(_driver);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class Table {
    constructor() {
        this.columnsContainer = this.createColumnsContainer();
        this.indexesContainer = this.createIndexesContainer();
    }

    column(name) {
        return this.getColumnsContainer().column(name);
    }

    index(name) {
        return this.getIndexesContainer().index(name);
    }

    createColumnsContainer() {
        const setClass = this.getDriver().getColumnsClass();
        return new setClass(this);
    }

    createIndexesContainer() {
        const setClass = this.getDriver().getIndexesClass();
        return new setClass(this);
    }

    getColumnsContainer() {
        return this.columnsContainer;
    }

    getIndexesContainer() {
        return this.indexesContainer;
    }

    getColumn(name) {
        return this.getColumnsContainer().getColumn(name);
    }

    getColumns() {
        return this.getColumnsContainer().getColumns();
    }

    getIndex(name) {
        return this.getIndexesContainer().getIndex(name);
    }

    getIndexes() {
        return this.getIndexesContainer().getIndexes();
    }

    toObject() {
        const json = {
            autoIncrement: this.constructor.getAutoIncrement(),
            name: this.constructor.getName(),
            comment: this.constructor.getComment(),
            engine: this.constructor.getEngine(),
            collate: this.constructor.getCollate(),
            defaultCharset: this.constructor.getDefaultCharset(),
            columns: [],
            indexes: []
        };

        this.getColumns().forEach(column => {
            json.columns.push(column.getObjectValue());
        });

        this.getIndexes().forEach(index => {
            json.indexes.push(index.getObjectValue());
        });

        return json;
    }

    /**
     * Sets table driver.
     * @param driver
     * @returns {Table}
     */
    static setDriver(driver) {
        this.driver = driver;
        return this;
    }

    /**
     * Returns set driver.
     * @returns {Driver}
     */
    static getDriver() {
        return this.driver;
    }

    /**
     * Returns set driver.
     * @returns {Driver}
     */
    getDriver() {
        return this.constructor.driver;
    }

    static setEngine(value) {
        this.engine = value;
        return this;
    }

    static getEngine() {
        return this.engine;
    }

    getEngine() {
        return this.constructor.engine;
    }

    static setDefaultCharset(defaultCharset) {
        this.defaultCharset = defaultCharset;
        return this;
    }

    static getDefaultCharset() {
        return this.defaultCharset;
    }

    getDefaultCharset() {
        return this.constructor.defaultCharset;
    }

    static setCollate(collate) {
        this.collate = collate;
        return this;
    }

    static getCollate() {
        return this.collate;
    }

    getCollate() {
        return this.constructor.collate;
    }

    static setName(name) {
        this.tableName = name;
        return this;
    }

    static getName() {
        return this.tableName;
    }

    getName() {
        return this.constructor.getName();
    }

    static setComment(comment) {
        this.comment = comment;
        return this;
    }

    static getComment() {
        return this.comment;
    }

    getComment() {
        return this.constructor.getComment();
    }

    static setAutoIncrement(autoIncrement) {
        this.autoIncrement = autoIncrement;
        return this;
    }

    static getAutoIncrement() {
        return this.autoIncrement;
    }

    getAutoIncrement() {
        return this.constructor.getAutoIncrement();
    }

    create(options = {}) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const sql = yield _this.getDriver().create(_this, options);
            if (options.returnSQL) {
                return sql;
            }

            return _this.getDriver().execute(sql);
        })();
    }

    alter(options = {}) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const sql = yield _this2.getDriver().alter(_this2, options);
            if (options.returnSQL) {
                return sql;
            }

            return _this2.getDriver().execute(sql);
        })();
    }

    drop(options = {}) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const sql = yield _this3.getDriver().drop(_this3, options);
            if (options.returnSQL) {
                return sql;
            }

            return _this3.getDriver().execute(sql);
        })();
    }

    truncate(options = {}) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const sql = yield _this4.getDriver().truncate(_this4, options);
            if (options.returnSQL) {
                return sql;
            }

            return _this4.getDriver().execute(sql);
        })();
    }

    sync(options = {}) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const sql = yield _this5.getDriver().sync(_this5, options);
            if (options.returnSQL) {
                return sql;
            }

            return _this5.getDriver().execute(sql);
        })();
    }
}

Table.engine = null;
Table.tableName = null;
Table.defaultCharset = null;
Table.collate = null;
Table.comment = null;
Table.autoIncrement = null;
Table.driver = new _driver2.default();

exports.default = Table;
//# sourceMappingURL=table.js.map
