import sinon from "sinon";
import _ from "lodash";
import mysql from "mysql";
import { MySQLConnection } from "../src";

const sandbox = sinon.sandbox.create();

describe("mysql connection test", async () => {
    afterEach(() => sandbox.restore());

    test("should correctly differentiate between instances of pool, connection", async () => {
        const instance1 = new MySQLConnection(mysql.createPool({}));
        expect(instance1.isConnectionPool()).toEqual(true);
        expect(instance1.isConnection()).toEqual(false);

        const instance2 = new MySQLConnection(mysql.createConnection({}));
        expect(instance2.isConnectionPool()).toEqual(false);
        expect(instance2.isConnection()).toEqual(true);
    });

    test("should not accept other than Connection / Pool instances as connection argument", async () => {
        try {
            new MySQLConnection({});
        } catch (e) {
            return;
        }
        throw Error(`Error should've been thrown.`);
    });

    test("should correctly query using pool of connections", async () => {
        const instance = new MySQLConnection(mysql.createPool({}));

        const fakeGetConnection = {
            query: _.noop,
            release: _.noop
        };

        const getConnectionStub = sandbox
            .stub(instance.getInstance(), "getConnection")
            .callsFake(callback => callback(null, fakeGetConnection));

        const releaseSpy = sandbox.spy(fakeGetConnection, "release");

        const queryWithConnectionStub = sandbox
            .stub(instance, "__executeQueryWithConnection")
            .callsFake(() => {
                return { insertId: 1 };
            });

        const results = await instance.query("INSERT INTO users ...");

        expect(getConnectionStub.callCount).toEqual(1);
        expect(releaseSpy.callCount).toEqual(1);
        expect(results.insertId).toEqual(1);

        getConnectionStub.restore();
        queryWithConnectionStub.restore();
        releaseSpy.restore();
    });

    test("should correctly execute more than one SQL query using a single connection", async () => {
        const instance = new MySQLConnection(mysql.createConnection({}));

        const queryStub = sandbox
            .stub(instance.getInstance(), "query")
            .onCall(0)
            .callsFake((sql, callback) => {
                return callback(null, [{ id: 1 }, { id: 2 }]);
            })
            .onCall(1)
            .callsFake((sql, callback) => {
                return callback(null, [{ count: 1 }]);
            });

        const endConnectionStub = sandbox
            .stub(instance.getInstance(), "end")
            .onCall(0)
            .callsFake(callback => callback());

        const results = await instance.query([
            "SELECT * FROM users",
            "SELECT FOUND_ROWS() as count"
        ]);

        expect(queryStub.callCount).toEqual(2);

        expect(results).toHaveLength(2);
        expect(results[0][0].id).toEqual(1);
        expect(results[0][1].id).toEqual(2);
        expect(results[1][0].count).toEqual(1);

        queryStub.restore();
        endConnectionStub.restore();
    });

    test("should return an error when using a single connection", async () => {
        const instance = new MySQLConnection(mysql.createConnection({}));

        const queryStub = sandbox
            .stub(instance.getInstance(), "query")
            .onCall(0)
            .callsFake((sql, callback) => {
                return callback("Something went wrong.", null);
            });

        const endConnectionStub = sandbox
            .stub(instance.getInstance(), "end")
            .onCall(0)
            .callsFake(callback => {
                callback();
            });

        try {
            await instance.query(["SELECT * FROM users", "SELECT FOUND_ROWS() as count"]);
        } catch (e) {
            return;
        } finally {
            queryStub.restore();
            endConnectionStub.restore();
        }

        throw Error(`Error should've been thrown.`);
    });

    test("should correctly execute more than one SQL query using pool of connections", async () => {
        const instance = new MySQLConnection(mysql.createPool({}));

        const fakeGetConnection = {
            query: _.noop,
            release: _.noop
        };

        const getConnectionStub = sandbox
            .stub(instance.getInstance(), "getConnection")
            .callsFake(callback => callback(null, fakeGetConnection));

        const releaseSpy = sandbox.spy(fakeGetConnection, "release");

        const queryWithConnectionStub = sandbox
            .stub(instance, "__executeQueryWithConnection")
            .onCall(0)
            .callsFake(() => {
                return [{ id: 1 }, { id: 2 }];
            })
            .onCall(1)
            .callsFake(() => {
                return [{ count: 1 }];
            });

        const results = await instance.query([
            "SELECT * FROM users",
            "SELECT FOUND_ROWS() as count"
        ]);

        expect(getConnectionStub.callCount).toEqual(1);
        expect(releaseSpy.callCount).toEqual(1);

        expect(results).toHaveLength(2);
        expect(results[0][0].id).toEqual(1);
        expect(results[0][1].id).toEqual(2);
        expect(results[1][0].count).toEqual(1);

        releaseSpy.restore();
        getConnectionStub.restore();
        queryWithConnectionStub.restore();
    });

    test("should return an error when using a pool of connections", async () => {
        const instance = new MySQLConnection(mysql.createPool({}));

        const fakeGetConnection = {
            query: (sql, callback) => {
                return callback("Something went wrong.", null);
            },
            release: callback => {}
        };

        const getConnectionStub = sandbox
            .stub(instance.getInstance(), "getConnection")
            .callsFake(callback => callback(null, fakeGetConnection));

        const releaseSpy = sandbox.spy(fakeGetConnection, "release");

        try {
            await instance.query(["SELECT * FROM users", "SELECT FOUND_ROWS() as count"]);
        } catch (e) {
            expect(releaseSpy.callCount).toEqual(1);
            return;
        } finally {
            releaseSpy.restore();
            getConnectionStub.restore();
        }

        throw Error(`Error should've been thrown.`);
    });

    test("should throw an error on connection error", async () => {
        const instance = new MySQLConnection(mysql.createPool({}));
        const getConnectionStub = sandbox
            .stub(instance.getInstance(), "getConnection")
            .callsFake(callback => callback("Something went wrong."));

        try {
            await instance.query("INSERT INTO users ...");
        } catch (e) {
            return;
        } finally {
            expect(getConnectionStub.callCount).toEqual(1);
            getConnectionStub.restore();
        }

        throw Error(`Error should've been thrown.`);
    });

    test("should throw an error on query error", async () => {
        const instance = new MySQLConnection(mysql.createPool({}));
        let queryExecuted = false;
        const getConnectionStub = sandbox
            .stub(instance.getInstance(), "getConnection")
            .onCall(0)
            .callsFake(callback =>
                callback(null, {
                    query: (sql, callback) => {
                        queryExecuted = true;
                        callback("Something went wrong.");
                    },
                    release: _.noop
                })
            );

        try {
            await instance.query("INSERT INTO users ...");
        } catch (e) {
            return;
        } finally {
            expect(queryExecuted).toEqual(true);
            expect(getConnectionStub.callCount).toEqual(1);
            getConnectionStub.restore();
        }

        throw Error(`Error should've been thrown.`);
    });

    test("should correctly query using single connection", async () => {
        const instance = new MySQLConnection(mysql.createConnection({}));

        const endStub = sandbox
            .stub(instance.getInstance(), "end")
            .callsFake(callback => callback());
        const queryStub = sandbox
            .stub(instance.getInstance(), "query")
            .callsFake((sql, callback) => {
                callback(null, { insertId: 1 });
            });

        const results = await instance.query("INSERT INTO users ...");

        endStub.restore();
        queryStub.restore();

        expect(results.insertId).toEqual(1);
        expect(queryStub.callCount).toEqual(1);
        expect(endStub.callCount).toEqual(0);
    });

    test("should correctly more SQL queries using single connection", async () => {
        const instance = new MySQLConnection(mysql.createConnection({}));

        const endStub = sandbox
            .stub(instance.getInstance(), "end")
            .callsFake(callback => callback());
        const queryStub = sandbox
            .stub(instance.getInstance(), "query")
            .onCall(0)
            .callsFake((sql, callback) => {
                callback(null, [{ id: 1 }, { id: 2 }]);
            })
            .onCall(1)
            .callsFake((sql, callback) => {
                callback(null, [{ count: 1 }]);
            });

        const results = await instance.query([
            "SELECT * FROM users",
            "SELECT FOUND_ROWS() as count"
        ]);

        endStub.restore();
        queryStub.restore();

        expect(results).toHaveLength(2);
        expect(results[0][0].id).toEqual(1);
        expect(results[0][1].id).toEqual(2);
        expect(results[1][0].count).toEqual(1);

        expect(queryStub.callCount).toEqual(2);
        expect(endStub.callCount).toEqual(0);
    });

    test("should throw an error on query error", async () => {
        const instance = new MySQLConnection(mysql.createConnection({}));

        const endStub = sandbox
            .stub(instance.getInstance(), "end")
            .callsFake(callback => callback());
        const queryStub = sandbox
            .stub(instance.getInstance(), "query")
            .callsFake((sql, callback) => {
                callback("Something went wrong.");
            });

        try {
            await instance.query("INSERT INTO users ...");
        } catch (e) {
            return;
        } finally {
            queryStub.restore();
            endStub.restore();

            expect(queryStub.callCount).toEqual(1);
            expect(endStub.callCount).toEqual(0);
        }

        throw Error(`Error should've been thrown.`);
    });
});
