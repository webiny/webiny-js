import { afterEach, describe, expect, it } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { Container } from "@webiny/feature/api";
import type { StoredPasswordResetCode } from "@webiny/self-hosted-auth";
import {
    ListLivePasswordResetCodesStorageOperation,
    SavePasswordResetCodeStorageOperation,
    SetPasswordResetCodeHashStorageOperation
} from "@webiny/self-hosted-auth";
import {
    KnexPasswordResetCodesTable,
    PasswordResetCodesTable
} from "~/passwordResetCodes/PasswordResetCodesTable.js";
import { SqlSavePasswordResetCode } from "~/passwordResetCodes/SqlSavePasswordResetCode.js";
import { SqlSetPasswordResetCodeHash } from "~/passwordResetCodes/SqlSetPasswordResetCodeHash.js";
import { SqlListLivePasswordResetCodes } from "~/passwordResetCodes/SqlListLivePasswordResetCodes.js";

const connections: Knex[] = [];

afterEach(async () => {
    await Promise.all(connections.splice(0).map(knex => knex.destroy()));
});

const setup = () => {
    const knex = knexLib({
        client: "better-sqlite3",
        connection: { filename: ":memory:" },
        useNullAsDefault: true
    });
    connections.push(knex);

    const container = new Container();
    container.registerInstance(
        PasswordResetCodesTable,
        new KnexPasswordResetCodesTable(knex, new TableManager(knex, "test_"))
    );
    container.register(SqlSavePasswordResetCode);
    container.register(SqlSetPasswordResetCodeHash);
    container.register(SqlListLivePasswordResetCodes);

    return {
        save: container.resolve(SavePasswordResetCodeStorageOperation),
        setHash: container.resolve(SetPasswordResetCodeHashStorageOperation),
        listLive: container.resolve(ListLivePasswordResetCodesStorageOperation)
    };
};

const request = (overrides: Partial<StoredPasswordResetCode> = {}): StoredPasswordResetCode => ({
    id: "code-1",
    email: "admin@example.com",
    codeHash: null,
    createdOn: "2026-01-01T00:00:00.000Z",
    expiresOn: "2099-01-01T00:00:00.000Z",
    usedOn: null,
    attempts: 0,
    ...overrides
});

const live = (ops: ReturnType<typeof setup>) => {
    return ops.listLive.execute({ email: "admin@example.com", now: "2026-01-02T00:00:00.000Z" });
};

describe("password reset codes on SQL", () => {
    it("reads a request saved without a code back with no code", async () => {
        const ops = setup();

        await ops.save.execute({ code: request() });

        expect((await live(ops))[0]!.codeHash).toBeNull();
    });

    it("sets the code on a request that has none", async () => {
        const ops = setup();
        await ops.save.execute({ code: request() });

        const updated = await ops.setHash.execute({ id: "code-1", codeHash: "hash-1" });

        expect(updated).toBe(true);
        expect((await live(ops))[0]!.codeHash).toBe("hash-1");
    });

    /** A second run of the task must not replace a code that is already in a mailbox. */
    it("does not replace a code that is already set", async () => {
        const ops = setup();
        await ops.save.execute({ code: request() });
        await ops.setHash.execute({ id: "code-1", codeHash: "hash-1" });

        const updated = await ops.setHash.execute({ id: "code-1", codeHash: "hash-2" });

        expect(updated).toBe(false);
        expect((await live(ops))[0]!.codeHash).toBe("hash-1");
    });

    it("reports a request that does not exist", async () => {
        const ops = setup();

        expect(await ops.setHash.execute({ id: "missing", codeHash: "hash-1" })).toBe(false);
    });
});
