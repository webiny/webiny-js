// @flow
import PoolClass from "mysql/lib/Pool";
import debug from "debug";
import ConnectionClass from "mysql/lib/Connection";

const log = debug("webiny-mysql-connection");

class MySQLConnection {
    instance: PoolClass | ConnectionClass;

    constructor(instance: PoolClass | ConnectionClass) {
        // Will throw an error if an invalid instance was passed.
        this.constructor.validateMySQLInstance(instance);

        // If everything went okay, let's assign and continue.
        this.instance = instance;
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

    static validateMySQLInstance(instance: mixed): void {
        if (instance instanceof PoolClass || instance instanceof ConnectionClass) {
            return;
        }
        throw Error("A valid MySQL connection or pool must be passed.");
    }

    query(sql: string | Array<any>): Promise<any> {
        let results: Array<mixed> = [],
            queries: Array<string> = sql instanceof Array ? sql : [sql];

        log(sql);

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
                        connection.release();
                        return reject(e);
                    }

                    connection.release();
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

    /**
     * Tests connection - just sends a simple query.
     */
    async test(): Promise<boolean> {
        await this.query("SELECT version()");
        return true;
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
