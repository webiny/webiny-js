"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _mdbid = require("mdbid");

var _mdbid2 = _interopRequireDefault(_mdbid);

var _webinyEntity = require("webiny-entity");

var _webinyMysqlConnection = require("webiny-mysql-connection");

var _statements = require("./statements");

var _model = require("./model");

var _operators = require("./operators");

var _operators2 = _interopRequireDefault(_operators);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class MySQLDriver extends _webinyEntity.Driver {
    constructor(options) {
        super();
        this.operators = (0, _assign2.default)({}, _operators2.default, options.operators);
        this.connection = new _webinyMysqlConnection.MySQLConnection(options.connection);
        this.model = options.model || _model.MySQLModel;

        this.tables = _lodash2.default.merge(
            {
                prefix: "",
                naming: null
            },
            options.tables
        );
    }

    setOperator(name, operator) {
        this.operators[name] = operator;
        return this;
    }

    onEntityConstruct(entity) {
        entity
            .attr("id")
            .char()
            .setValidators((value, attribute) =>
                this.isId(attribute.getParentModel().getParentEntity(), value)
            );
    }

    getModelClass() {
        return this.model;
    }

    // eslint-disable-next-line
    save(entity, options) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (!entity.isExisting()) {
                entity.id = MySQLDriver.__generateID();
            }

            if (entity.isExisting()) {
                const data = yield entity.toStorage();
                const sql = new _statements.Update(
                    {
                        operators: _this.operators,
                        table: _this.getTableName(entity),
                        data,
                        where: { id: data.id },
                        limit: 1
                    },
                    entity
                ).generate();

                yield _this.getConnection().query(sql);
                return new _webinyEntity.QueryResult(true);
            }

            const data = yield entity.toStorage();
            const sql = new _statements.Insert(
                {
                    operators: _this.operators,
                    data,
                    table: _this.getTableName(entity)
                },
                entity
            ).generate();

            try {
                yield _this.getConnection().query(sql);
            } catch (e) {
                entity.id && entity.getAttribute("id").reset();
                throw e;
            }

            return new _webinyEntity.QueryResult(true);
        })();
    }

    // eslint-disable-next-line
    delete(entity, options) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const id = yield entity.getAttribute("id").getStorageValue();
            const sql = new _statements.Delete(
                {
                    operators: _this2.operators,
                    table: _this2.getTableName(entity),
                    where: { id },
                    limit: 1
                },
                entity
            ).generate();

            yield _this2.getConnection().query(sql);
            return new _webinyEntity.QueryResult(true);
        })();
    }

    find(entity, options) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const clonedOptions = _lodash2.default.merge({}, options, {
                operators: _this3.operators,
                table: _this3.getTableName(entity),
                operation: "select",
                limit: 10,
                offset: 0
            });

            MySQLDriver.__preparePerPageOption(clonedOptions);
            MySQLDriver.__preparePageOption(clonedOptions);
            MySQLDriver.__prepareQueryOption(clonedOptions);
            MySQLDriver.__prepareSearchOption(clonedOptions);

            clonedOptions.calculateFoundRows = true;

            const sql = new _statements.Select(clonedOptions, entity).generate();
            const results = yield _this3
                .getConnection()
                .query([sql, "SELECT FOUND_ROWS() as count"]);

            return new _webinyEntity.QueryResult(results[0], { totalCount: results[1][0].count });
        })();
    }

    findOne(entity, options) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const clonedOptions = {
                operators: _this4.operators,
                table: _this4.getTableName(entity),
                where: options.query,
                search: options.search,
                limit: 1
            };

            MySQLDriver.__prepareQueryOption(clonedOptions);
            MySQLDriver.__prepareSearchOption(clonedOptions);

            const sql = new _statements.Select(clonedOptions, entity).generate();

            const results = yield _this4.getConnection().query(sql);
            return new _webinyEntity.QueryResult(results[0]);
        })();
    }

    count(entity, options) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const clonedOptions = _lodash2.default.merge(
                {},
                options,
                {
                    operators: _this5.operators,
                    table: _this5.getTableName(entity),
                    columns: ["COUNT(*) AS count"]
                },
                entity
            );

            MySQLDriver.__prepareQueryOption(clonedOptions);
            MySQLDriver.__prepareSearchOption(clonedOptions);

            const sql = new _statements.Select(clonedOptions, entity).generate();

            const results = yield _this5.getConnection().query(sql);
            return new _webinyEntity.QueryResult(results[0].count);
        })();
    }

    // eslint-disable-next-line
    isId(entity, value, options) {
        if (typeof value === "string") {
            return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
        }

        return false;
    }

    getConnection() {
        return this.connection;
    }

    setTablePrefix(tablePrefix) {
        this.tables.prefix = tablePrefix;
        return this;
    }

    getTablePrefix() {
        return this.tables.prefix;
    }

    setTableNaming(tableNameValue) {
        this.tables.naming = tableNameValue;
        return this;
    }

    getTableNaming() {
        return this.tables.naming;
    }

    getTableName(entity) {
        const isClass = typeof entity === "function";
        const params = {
            classId: isClass ? entity.classId : entity.constructor.classId,
            tableName: isClass ? entity.tableName : entity.constructor.tableName
        };

        const getTableName = this.getTableNaming();
        if (typeof getTableName === "function") {
            return getTableName((0, _assign2.default)({ entity }, params, { driver: this }));
        }

        if (params.tableName) {
            return this.tables.prefix + params.tableName;
        }

        return this.tables.prefix + params.classId;
    }

    static MySQLDriver(clonedOptions) {
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

    static __preparePerPageOption(clonedOptions) {
        if ("perPage" in clonedOptions) {
            clonedOptions.limit = clonedOptions.perPage;
            delete clonedOptions.perPage;
        }
    }

    static __preparePageOption(clonedOptions) {
        if ("page" in clonedOptions) {
            clonedOptions.offset = clonedOptions.limit * (clonedOptions.page - 1);
            delete clonedOptions.page;
        }
    }

    static __prepareQueryOption(clonedOptions) {
        if (clonedOptions.query instanceof Object) {
            clonedOptions.where = clonedOptions.query;
            delete clonedOptions.query;
        }
    }

    static __prepareSearchOption(clonedOptions) {
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
        return (0, _mdbid2.default)();
    }
}
exports.default = MySQLDriver;
//# sourceMappingURL=mysqlDriver.js.map
