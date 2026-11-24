import type { Knex } from "knex";
import type { ISchemaMemory } from "./getSchemaMemory.js";

export type TableCreator = (table: Knex.CreateTableBuilder) => void;

export interface EnsureTableParams {
    /** The connection or transaction to check and create the table on. */
    knex: Knex;
    /** What the process knows about the tables this one belongs to. */
    memory: ISchemaMemory;
    tableName: string;
    create: TableCreator;
}

/*
 * Checks in flight, per memory, table and handle, so concurrent first uses share one
 * hasTable+createTable instead of racing into "table already exists".
 */
const inFlight = new Map<string, Promise<void>>();

const transactionIds = new WeakMap<object, number>();
let lastTransactionId = 0;

/*
 * Which handle a check runs on. A transaction shares its connection's key (`getConnectionKey`), but
 * a table it creates is visible to others only once it commits, and is gone if it rolls back. So a
 * check in a transaction is shared only with checks in that same transaction.
 */
const handleOf = (knex: Knex): string => {
    if (!knex.isTransaction) {
        return "connection";
    }
    let id = transactionIds.get(knex);
    if (id === undefined) {
        lastTransactionId += 1;
        id = lastTransactionId;
        transactionIds.set(knex, id);
    }
    return `trx${id}`;
};

/**
 * Creates the table if it doesn't exist yet, once per process: a table the memory knows is skipped,
 * and concurrent callers on the same handle wait for one check. What a transaction creates is
 * remembered only by `recordTable` after it commits, never here, and nothing started before the
 * memory was reset is recorded after it.
 */
export function ensureTable(params: EnsureTableParams): Promise<void> {
    const { knex, memory, tableName, create } = params;
    if (memory.known.has(tableName)) {
        return Promise.resolve();
    }

    const generation = memory.generation;
    const key = `${memory.key}#${generation}:${tableName}:${handleOf(knex)}`;
    const pending = inFlight.get(key);
    if (pending) {
        return pending;
    }

    const check: Promise<void> = createTableIfMissing(knex, tableName, create)
        .then(() => {
            if (memory.generation === generation) {
                recordTable(knex, memory, tableName);
            }
        })
        .finally(() => {
            if (inFlight.get(key) === check) {
                inFlight.delete(key);
            }
        });
    inFlight.set(key, check);
    return check;
}

/**
 * Records that the table exists, unless `knex` is a transaction: it can still roll back, and the
 * table with it, so only a committed table is known.
 */
export function recordTable(knex: Knex, memory: ISchemaMemory, tableName: string): void {
    if (!knex.isTransaction) {
        memory.known.add(tableName);
    }
}

/**
 * Creates the table if it doesn't exist. Another process (or connection) may create it between the
 * check and the create: if it exists after a failed create, that's success.
 */
export async function createTableIfMissing(
    knex: Knex,
    tableName: string,
    create: TableCreator
): Promise<void> {
    if (await knex.schema.hasTable(tableName)) {
        return;
    }
    try {
        await knex.schema.createTable(tableName, create);
    } catch (error) {
        if (await knex.schema.hasTable(tableName)) {
            return;
        }
        throw error;
    }
}
