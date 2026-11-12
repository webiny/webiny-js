import { describe, expect, it, vi } from "vitest";
import type { Knex } from "knex";
import { ensureTable, getSchemaMemory } from "~/index.js";

/*
 * A knex handle whose schema calls are recorded and wait until the test lets them through, so the
 * test decides what overlaps. Handles made from one `database` share its connection key, as a
 * transaction shares its connection's.
 */
const createDatabase = () => {
    const tables = new Set<string>();
    const config = {};
    let release: () => void = () => undefined;
    let gate = Promise.resolve();

    const handle = (isTransaction: boolean) => {
        const createTable = vi.fn(async (name: string) => {
            await gate;
            if (tables.has(name)) {
                throw new Error(`relation "${name}" already exists`);
            }
            tables.add(name);
        });
        const hasTable = vi.fn(async (name: string) => {
            await gate;
            return tables.has(name);
        });
        const knex = {
            isTransaction,
            client: { config },
            schema: { hasTable, createTable }
        } as unknown as Knex;
        return { knex, hasTable, createTable };
    };

    return {
        tables,
        connection: () => handle(false),
        transaction: () => handle(true),
        hold: () => {
            gate = new Promise<void>(resolve => {
                release = resolve;
            });
        },
        release: () => release()
    };
};

let memories = 0;
const newMemory = () => {
    memories += 1;
    return getSchemaMemory(`test.ensureTable:${memories}`);
};

const create = () => undefined;

describe("ensureTable", () => {
    it("makes concurrent first uses of a table share one check", async () => {
        const database = createDatabase();
        const memory = newMemory();
        const first = database.connection();
        const second = database.connection();

        database.hold();
        const both = Promise.all([
            ensureTable({ knex: first.knex, memory, tableName: "groups", create }),
            ensureTable({ knex: second.knex, memory, tableName: "groups", create })
        ]);
        database.release();
        await both;

        expect(first.createTable).toHaveBeenCalledTimes(1);
        expect(second.hasTable).not.toHaveBeenCalled();
        expect(memory.known.has("groups")).toBe(true);
    });

    it("doesn't let a connection wait for a check in a transaction", async () => {
        const database = createDatabase();
        const memory = newMemory();
        const trx = database.transaction();
        const connection = database.connection();

        database.hold();
        const inTransaction = ensureTable({ knex: trx.knex, memory, tableName: "t", create });
        const onConnection = ensureTable({
            knex: connection.knex,
            memory,
            tableName: "t",
            create
        });
        database.release();
        await Promise.all([inTransaction, onConnection]);

        // The connection ran its own check: the transaction's table isn't visible to it until commit.
        expect(connection.hasTable).toHaveBeenCalled();
    });

    it("remembers only what was created outside a transaction", async () => {
        const database = createDatabase();
        const memory = newMemory();

        await ensureTable({ knex: database.transaction().knex, memory, tableName: "t", create });
        expect(memory.known.has("t")).toBe(false);

        await ensureTable({ knex: database.connection().knex, memory, tableName: "t", create });
        expect(memory.known.has("t")).toBe(true);
    });

    it("records nothing from a check that ends after the memory was reset", async () => {
        const database = createDatabase();
        const memory = newMemory();

        database.hold();
        const check = ensureTable({
            knex: database.connection().knex,
            memory,
            tableName: "t",
            create
        });
        memory.reset();
        database.release();
        await check;

        expect(memory.known.has("t")).toBe(false);
    });
});

describe("schema memory once()", () => {
    it("isn't marked ready by a run that ends after a reset", async () => {
        const memory = newMemory();
        let finish: () => void = () => undefined;
        const run = memory.once(
            () =>
                new Promise<void>(resolve => {
                    finish = resolve;
                })
        );

        memory.reset();
        finish();
        await run;

        expect(memory.isReady()).toBe(false);
    });

    it("doesn't let an old failure clear a newer run", async () => {
        const memory = newMemory();
        let fail: (error: Error) => void = () => undefined;
        const oldRun = memory.once(
            () =>
                new Promise<void>((_, reject) => {
                    fail = reject;
                })
        );

        memory.reset();
        let finishNew: () => void = () => undefined;
        const newRun = memory.once(
            () =>
                new Promise<void>(resolve => {
                    finishNew = resolve;
                })
        );
        fail(new Error("old"));
        await expect(oldRun).rejects.toThrow("old");

        // A caller now still waits for the newer run instead of starting another.
        const create = vi.fn(async () => undefined);
        const joined = memory.once(create);
        finishNew();
        await Promise.all([newRun, joined]);

        expect(create).not.toHaveBeenCalled();
        expect(memory.isReady()).toBe(true);
    });
});
