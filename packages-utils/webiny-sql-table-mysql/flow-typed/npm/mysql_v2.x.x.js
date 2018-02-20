// TODO: Events on event emitters
// TODO: Ssl structure type in ConnectionOptions
// TODO: PoolNamespace internal structure
// TODO: Packets internal structure

declare module "mysql" {
    declare type ConnectionOptions = {
        host?: string,
        port?: number,
        localAddress?: string,
        socketPath?: string,
        user: string,
        password: string,
        database?: string,
        charset?: string,
        timezone?: string,
        connectTimeout?: number,
        stringifyObjects?: boolean,
        insecureAuth?: boolean,
        typeCast?: boolean | ((field: Object, next: Function) => any),
        queryFormat?: (query: string, values: ?mixed, timezone: string) => string,
        supportBigNumbers?: boolean,
        bigNumberStrings?: boolean,
        dateStrings?: boolean | Array<string>,
        debug?: boolean | Array<string>, // Array form contains ids of packets for logging
        trace?: boolean,
        multipleStatements?: boolean,
        flags?: string,
        ssl?: string | Object
    };

    declare type QueryOptions =
        | {
              sql: string,
              typeCast?: boolean | ((field: Object, next: Function) => any),
              nestTables?: boolean | string, // string form is a separator used to produce column names
              values?: Array<mixed>,
              timeout?: number
          }
        | string;

    declare type QueryResults = Array<Object> & {
        insertId?: string | number,
        affectedRows?: number,
        changedRows?: number
    };

    declare type QueryField = {
        name: string,
        type: string,
        length: number,
        table: string,
        db: string
    };

    declare class Query extends events$EventEmitter {
        // readableStreamOptions declared in Flow /lib/node.js
        stream(options?: readableStreamOptions): stream$Readable;
    }

    declare class Connection extends events$EventEmitter {
        threadId: number;
        connect(callback?: (error: ?Error) => *): void;

        release(): void;
        destroy(): void;

        end(callback?: (error: ?Error) => *): void;

        query(sql: QueryOptions, values?: Array<mixed> | Object, callback?: QueryCallback): Query;
        query(sql: QueryOptions, callback?: QueryCallback): Query;

        changeUser(
            options: {
                user?: string,
                password?: string,
                charset?: string,
                database?: string
            },
            callback: (error: ?Error) => *
        ): void;

        beginTransaction(options: QueryOptions, callback: QueryCallback): void;
        beginTransaction(callback: QueryCallback): void;
        commit(options: QueryOptions, callback: QueryCallback): void;
        commit(callback: QueryCallback): void;
        rollback(options: QueryOptions, callback: QueryCallback): void;
        rollback(callback: QueryCallback): void;

        ping(options: QueryOptions, callback: QueryCallback): void;
        ping(callback: QueryCallback): void;

        escapeId(val: mixed, forbidQualified?: boolean): string;
        escape(val: mixed, stringifyObjects?: boolean, timeZone?: string): string;
        format(sql: string, valus: Array<mixed>): string;
    }

    declare class Pool extends events$EventEmitter {
        getConnection(callback: (error: ?Error, connection?: Connection) => *): void;
        end(callback?: (error: ?Error) => *): void;
        query(sql: QueryOptions, values?: Array<mixed>, callback?: QueryCallback): Query;
        query(sql: QueryOptions, callback?: QueryCallback): Query;

        escapeId(val: mixed, forbidQualified?: boolean): string;
        escape(val: mixed, stringifyObjects?: boolean, timeZone?: string): string;
    }

    declare type PoolOptions = ConnectionOptions & {
        acquireTimeout?: number,
        connectionLimit?: number,
        waitForConnections?: boolean,
        queueLimit?: number
    };

    declare type PoolClusterSelector = "RR" | "ORDER" | "RANDOM";

    declare type PoolClusterOptions = {
        defaultSelector?: PoolClusterSelector,
        canRetry?: boolean,
        removeNodeErrorCount?: number,
        restoreNodeTimeout?: number
    };

    declare type QueryCallback = (
        error: ?Error,
        results: QueryResults,
        fields?: Array<QueryField>
    ) => *;

    declare class PoolCluster extends events$EventEmitter {
        add(config: PoolOptions | string): void;
        add(name: string, config: PoolOptions | string): void;
        remove(name: string): void;

        getConnection(
            pattern: string | RegExp,
            selector: PoolClusterSelector,
            callback: (error: ?Error, connection?: Connection) => *
        ): void;
        getConnection(
            pattern: string | RegExp,
            callback: (error: ?Error, connection?: Connection) => *
        ): void;
        getConnection(callback: (error: ?Error, connection?: Connection) => *): void;

        // Truth to be told, of returns not a Pool, but PoolNamespace instance but it is the same for the most part
        of(pattern: string | RegExp, selector?: PoolClusterSelector): Pool;

        end(callback?: (error: ?Error) => *): void;
    }

    declare function escapeId(val: mixed, forbidQualified?: boolean): string;
    declare function escape(val: mixed, stringifyObjects?: boolean, timeZone?: string): string;
    declare function format(sql: string, valus: Array<mixed>): string;
    declare function createConnection(options: ConnectionOptions | string): Connection;
    declare function createPool(options: PoolOptions | string): Pool;
    declare function createPoolCluster(options?: PoolClusterOptions): PoolCluster;
    declare function raw(sql: string): { toSqlString: () => string };
}
