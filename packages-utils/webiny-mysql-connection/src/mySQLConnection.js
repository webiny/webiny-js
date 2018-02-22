// @flow
import PoolClass from "mysql/lib/Pool";
import ConnectionClass from "mysql/lib/Connection";

class MySQLConnection {
    instance: PoolClass | ConnectionClass;

    constructor(connection: PoolClass | ConnectionClass) {
        this.instance = connection;
        // We don't need to do anything, if an already created MySQL connection or pool instance was passed.
        // Otherwise, MySQL params were received, need to instantiate a new instance of connection or connection pool.
        if (!(this.isConnectionPool() || this.isConnection())) {
            throw Error("A valid MySQL connection or pool must be passed.");
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
        let results: Array<mixed> = [],
            queries: Array<string> = sql instanceof Array ? sql : [sql];

        return new Promise(async (resolve, reject) => {
            if (this.isConnectionPool()) {
                return this.getInstance().getConnection(async (error, connection) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    // We don't need to do release manually because it is handled by the mysql lib already.
                    try {
                        results = await this.__executeQueriesWithConnection(connection, queries);
                    } catch (e) {
                        return reject(e);
                    }

                    queries.length === 1 ? resolve(results[0]) : resolve(results);
                });
            }

            // We don't close the passed connection, because it might be used outside of the scope of entity.
            try {
                results = await this.__executeQueriesWithConnection(this.getInstance(), queries);
                queries.length === 1 ? resolve(results[0]) : resolve(results);
            } catch (e) {
                reject(e);
            }
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
