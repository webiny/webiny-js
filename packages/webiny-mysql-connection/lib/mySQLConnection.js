"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _Pool = require("mysql/lib/Pool");

var _Pool2 = _interopRequireDefault(_Pool);

var _Connection = require("mysql/lib/Connection");

var _Connection2 = _interopRequireDefault(_Connection);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

class MySQLConnection {
    constructor(instance) {
        // Will throw an error if an invalid instance was passed.
        this.constructor.validateMySQLInstance(instance);

        // If everything went okay, let's assign and continue.
        this.instance = instance;
    }

    getInstance() {
        return this.instance;
    }

    isConnectionPool() {
        return this.getInstance() instanceof _Pool2.default;
    }

    isConnection() {
        return this.getInstance() instanceof _Connection2.default;
    }

    static validateMySQLInstance(instance) {
        if (instance instanceof _Pool2.default || instance instanceof _Connection2.default) {
            return;
        }
        throw Error("A valid MySQL connection or pool must be passed.");
    }

    query(sql) {
        var _this = this;

        let results = [],
            queries = sql instanceof Array ? sql : [sql];

        return new _promise2.default(
            (() => {
                var _ref = (0, _asyncToGenerator3.default)(function*(resolve, reject) {
                    if (_this.isConnectionPool()) {
                        return _this.getInstance().getConnection(
                            (() => {
                                var _ref2 = (0, _asyncToGenerator3.default)(function*(
                                    error,
                                    connection
                                ) {
                                    if (error) {
                                        reject(error);
                                        return;
                                    }

                                    try {
                                        results = yield _this.__executeQueriesWithConnection(
                                            connection,
                                            queries
                                        );
                                    } catch (e) {
                                        connection.release();
                                        return reject(e);
                                    }

                                    connection.release();
                                    queries.length === 1 ? resolve(results[0]) : resolve(results);
                                });

                                return function(_x3, _x4) {
                                    return _ref2.apply(this, arguments);
                                };
                            })()
                        );
                    }

                    // We don't close the passed connection, because it might be used outside of the scope of entity.
                    try {
                        results = yield _this.__executeQueriesWithConnection(
                            _this.getInstance(),
                            queries
                        );
                        queries.length === 1 ? resolve(results[0]) : resolve(results);
                    } catch (e) {
                        reject(e);
                    }
                });

                return function(_x, _x2) {
                    return _ref.apply(this, arguments);
                };
            })()
        );
    }

    __executeQueriesWithConnection(connection, queries) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function*() {
            const results = [];
            for (let i = 0; i < queries.length; i++) {
                results.push(yield _this2.__executeQueryWithConnection(connection, queries[i]));
            }
            return results;
        })();
    }

    __executeQueryWithConnection(connection, sql) {
        return (0, _asyncToGenerator3.default)(function*() {
            return new _promise2.default(function(resolve, reject) {
                connection.query(sql, function(error, results) {
                    if (error) {
                        return reject(error);
                    }

                    resolve(results);
                });
            });
        })();
    }
}

exports.default = MySQLConnection;
//# sourceMappingURL=mySQLConnection.js.map
