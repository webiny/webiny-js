import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import knexLib from "knex";
import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { Container } from "@webiny/feature/api";
import type { StoredPasswordResetCode } from "@webiny/self-hosted-auth";
import { ListLivePasswordResetCodesStorageOperation } from "@webiny/self-hosted-auth";
import { SavePasswordResetCodeStorageOperation } from "@webiny/self-hosted-auth";
import { SetPasswordResetCodeHashStorageOperation } from "@webiny/self-hosted-auth";
import { KnexPasswordResetCodesTable } from "~/passwordResetCodes/PasswordResetCodesTable.js";
import { PasswordResetCodesTable } from "~/passwordResetCodes/PasswordResetCodesTable.js";
import { SqlSavePasswordResetCode } from "~/passwordResetCodes/SqlSavePasswordResetCode.js";
import { SqlSetPasswordResetCodeHash } from "~/passwordResetCodes/SqlSetPasswordResetCodeHash.js";
import { SqlListLivePasswordResetCodes } from "~/passwordResetCodes/SqlListLivePasswordResetCodes.js";

const connections: Knex[] = [];

afterEach(async () => {
    const open = connections.splice(0);
    const closing = open.map(knex => knex.destroy());
    await Promise.all(closing);
});

const setup = () => {
    const knex = knexLib({
        client: "better-sqlite3",
        connection: { filename: ":memory:" },
        useNullAsDefault: true
    });
    connections.push(knex);

    const container = new Container();
    const tableManager = new TableManager(knex, "test_");
    const table = new KnexPasswordResetCodesTable(knex, tableManager);
    container.registerInstance(PasswordResetCodesTable, table);
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

// The hash of the one live row for the address.
const liveHash = async (ops: ReturnType<typeof setup>) => {
    const rows = await ops.listLive.execute({
        email: "admin@example.com",
        now: "2026-01-02T00:00:00.000Z"
    });
    return rows[0]!.codeHash;
};

describe("password reset codes on SQL", () => {
    it("reads a request saved without a code back with no code", async () => {
        const ops = setup();

        await ops.save.execute({ code: request() });

        const codeHash = await liveHash(ops);
        expect(codeHash).toBeNull();
    });

    it("sets the code on a request that has none", async () => {
        const ops = setup();
        await ops.save.execute({ code: request() });

        const updated = await ops.setHash.execute({ id: "code-1", codeHash: "hash-1" });

        expect(updated).toBe(true);
        const codeHash = await liveHash(ops);
        expect(codeHash).toBe("hash-1");
    });

    // A second run of the task must not replace a code that is already in a mailbox.
    it("does not replace a code that is already set", async () => {
        const ops = setup();
        await ops.save.execute({ code: request() });
        await ops.setHash.execute({ id: "code-1", codeHash: "hash-1" });

        const updated = await ops.setHash.execute({ id: "code-1", codeHash: "hash-2" });

        expect(updated).toBe(false);
        const codeHash = await liveHash(ops);
        expect(codeHash).toBe("hash-1");
    });

    it("reports a request that does not exist", async () => {
        const ops = setup();

        const updated = await ops.setHash.execute({ id: "missing", codeHash: "hash-1" });

        expect(updated).toBe(false);
    });
});
