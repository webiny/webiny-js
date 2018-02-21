// @flow
import PoolClass from "mysql/lib/Pool";
import ConnectionClass from "mysql/lib/Connection";
import mysql from "mysql";

class MySQLConnection {
    instance: PoolClass | ConnectionClass;

    constructor(connection: PoolClass | ConnectionClass | Object) {
        this.instance = connection;
        // We don't need to do anything, if an already created MySQL connection or pool instance was passed.
        // Otherwise, MySQL params were received, need to instantiate a new instance of connection or connection pool.
        if (!(this.isConnectionPool() || this.isConnection())) {
            if (connection.pool) {
                this.instance = mysql.createPool(connection);
            } else {
                this.instance = mysql.createConnection(connection);
            }
        }
    }

    getInstance(): PoolClass | ConnectionClass {
        return this.instance;
    }

    isConnectionPool(): boolean {
        return this.getInstance() instanceof PoolClass;
    }

    isConnection(): boolean {
        return this.getInstance() instanceof ConnectionClass;
    }

    query(sql: string | Array<any>): Promise<any> {
        console.log(sql);
        let results: Array<mixed> = [],
            queries: Array<string> = sql instanceof Array ? sql : [sql];

        return new Promise(async (resolve, reject) => {
            if (this.isConnectionPool()) {
                return this.getInstance().getConnection(async (error, connection) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    try {
                        results = await this.__executeQueriesWithConnection(connection, queries);
                    } catch (e) {
                        return reject(e);
                    } finally {
                        connection.release();
                    }

                    queries.length === 1 ? resolve(results[0]) : resolve(results);
                });
            }

            try {
                results = await this.__executeQueriesWithConnection(this.getInstance(), queries);
            } catch (e) {
                return reject(e);
            } finally {
                this.getInstance().end();
            }

            queries.length === 1 ? resolve(results[0]) : resolve(results);
        });
    }

    async __executeQueriesWithConnection(connection: ConnectionClass, queries: Array<string>) {
        const results = [];
        for (let i = 0; i < queries.length; i++) {
            results.push(await this.__executeQueryWithConnection(connection, queries[i]));
        }
        return results;
    }

    async __executeQueryWithConnection(
        connection: ConnectionClass,
        sql: string | Array<string>
    ): Promise<Array<mixed> | Object> {
        return new Promise((resolve, reject) => {
            connection.query(sql, (error, results) => {
                if (error) {
                    return reject(error);
                }

                resolve(results);
            });
        });
    }
}

export default MySQLConnection;
