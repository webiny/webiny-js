import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { beforeAll } from "vitest";
import { afterAll } from "vitest";
import { beforeEach } from "vitest";
import net from "node:net";
import knexLib from "knex";
import type { Knex } from "knex";
import { withPgConnectionRetry } from "~/connectionRetry/index.js";
import type { IPgConnectionRetryEvent } from "~/connectionRetry/index.js";

/**
 * Runs against a real Postgres (WEBINY_PG_HOST, _PORT, _USER, _PASSWORD, _DATABASE; the same settings
 * as the pg tests). The connection goes through a TCP proxy that can cut it at a chosen
 * statement, the way a database failover or a dropped proxy connection does.
 */

const pgSettings = {
    host: process.env.WEBINY_PG_HOST || "localhost",
    port: Number(process.env.WEBINY_PG_PORT || 5432),
    user: process.env.WEBINY_PG_USER || process.env.USER,
    password: process.env.WEBINY_PG_PASSWORD || "",
    database: process.env.WEBINY_PG_DATABASE || "webiny_test"
};

const TABLE = "connection_retry_items";

type CutMode =
    /* Close the connection before the statement reaches the server. */
    | "beforeServer"
    /* Let the statement reach the server, then close the connection before its reply arrives. */
    | "afterServer";

/* A TCP proxy in front of Postgres that cuts the client connection once, at a matching statement. */
class CuttingProxy {
    public port = 0;
    /* Close every new connection right away, like a database that's down. */
    public refuseConnections = false;
    private cut: { statement: RegExp; mode: CutMode } | undefined;
    private readonly server = net.createServer(client => this.handle(client));
    private readonly sockets = new Set<net.Socket>();

    public async start(): Promise<void> {
        await new Promise<void>(resolve => this.server.listen(0, "127.0.0.1", resolve));
        this.port = (this.server.address() as net.AddressInfo).port;
    }

    public async stop(): Promise<void> {
        for (const socket of this.sockets) {
            socket.destroy();
        }
        await new Promise(resolve => this.server.close(resolve));
    }

    public cutOnce(statement: RegExp, mode: CutMode): void {
        this.cut = { statement, mode };
    }

    private handle(client: net.Socket): void {
        if (this.refuseConnections) {
            client.destroy();
            return;
        }
        const upstream = net.connect(pgSettings.port, pgSettings.host);
        this.sockets.add(client);
        this.sockets.add(upstream);
        let dropReplies = false;
        const closeBoth = () => {
            client.destroy();
            upstream.destroy();
        };
        client.on("data", chunk => {
            const cut = this.cut;
            if (cut && cut.statement.test(chunk.toString("latin1"))) {
                this.cut = undefined;
                if (cut.mode === "beforeServer") {
                    closeBoth();
                    return;
                }
                dropReplies = true;
            }
            upstream.write(chunk);
        });
        upstream.on("data", chunk => {
            if (dropReplies) {
                // The server has done the work; the client never hears about it.
                client.destroy();
                upstream.end();
                return;
            }
            client.write(chunk);
        });
        client.on("error", closeBoth);
        upstream.on("error", closeBoth);
        client.on("close", () => upstream.end());
        upstream.on("close", () => client.destroy());
    }
}

const isPostgresAvailable = async (): Promise<boolean> => {
    const admin = knexLib({
        client: "pg",
        connection: { ...pgSettings, database: "postgres", connectionTimeoutMillis: 2000 },
        pool: { min: 0, max: 1 }
    });
    try {
        const exists = await admin.raw("SELECT 1 FROM pg_database WHERE datname = ?", [
            pgSettings.database
        ]);
        if (exists.rows.length === 0) {
            await admin.raw(`CREATE DATABASE "${pgSettings.database}"`);
        }
        return true;
    } catch {
        return false;
    } finally {
        await admin.destroy();
    }
};

const postgresAvailable = await isPostgresAvailable();

describe.skipIf(!postgresAvailable)("withPgConnectionRetry", () => {
    const proxy = new CuttingProxy();
    let knex: Knex;
    let events: IPgConnectionRetryEvent[];

    const countRows = async () => {
        const rows = await knex(TABLE).count<{ count: string }[]>({ count: "*" });
        return Number(rows[0].count);
    };

    beforeAll(async () => {
        await proxy.start();
        knex = withPgConnectionRetry(
            knexLib({
                client: "pg",
                connection: { ...pgSettings, host: "127.0.0.1", port: proxy.port },
                // As on Lambda: one connection, opened on demand.
                pool: { min: 0, max: 1 }
            }),
            { maxRetryMs: 2000, onEvent: event => events.push(event) }
        );
        await knex.raw(`DROP TABLE IF EXISTS "${TABLE}"`);
        await knex.raw(`CREATE TABLE "${TABLE}" (id text PRIMARY KEY)`);
    });

    afterAll(async () => {
        proxy.refuseConnections = false;
        await knex?.raw(`DROP TABLE IF EXISTS "${TABLE}"`);
        await knex?.destroy();
        await proxy.stop();
    });

    beforeEach(async () => {
        proxy.refuseConnections = false;
        await knex(TABLE).delete();
        events = [];
    });

    it("runs a transaction again when its connection is lost before COMMIT", async () => {
        proxy.cutOnce(/insert into/i, "beforeServer");
        let runs = 0;

        await knex.transaction(async trx => {
            runs++;
            await trx(TABLE).insert({ id: "a" });
        });

        expect(runs).toBe(2);
        expect(await countRows()).toBe(1);
    });

    it("returns the result without running again when COMMIT succeeded but its reply was lost", async () => {
        proxy.cutOnce(/COMMIT/, "afterServer");
        let runs = 0;

        const result = await knex.transaction(async trx => {
            runs++;
            await trx(TABLE).insert({ id: "a" });
            return "created";
        });

        expect(result).toBe("created");
        expect(runs).toBe(1);
        expect(await countRows()).toBe(1);
        expect(events.map(event => event.type)).toContain("commitConfirmed");
    });

    it("runs a transaction again when the connection is lost before COMMIT reaches the server", async () => {
        proxy.cutOnce(/COMMIT/, "beforeServer");
        let runs = 0;

        await knex.transaction(async trx => {
            runs++;
            await trx(TABLE).insert({ id: "a" });
        });

        expect(runs).toBe(2);
        expect(await countRows()).toBe(1);
        expect(events.map(event => event.type)).toContain("commitRolledBack");
    });

    it("returns a read-only transaction's result when its COMMIT fails", async () => {
        await knex(TABLE).insert({ id: "a" });
        events = [];
        proxy.cutOnce(/COMMIT/, "afterServer");
        let runs = 0;

        const ids = await knex.transaction(async trx => {
            runs++;
            await trx.raw("SET LOCAL enable_seqscan = off");
            return trx(TABLE).pluck("id");
        });

        expect(ids).toEqual(["a"]);
        expect(runs).toBe(1);
        expect(events.map(event => event.type)).toEqual(["readOnlyCommitIgnored"]);
    });

    it("runs a read outside a transaction again when its connection is lost", async () => {
        await knex(TABLE).insert({ id: "a" });
        proxy.cutOnce(/select \* from/i, "beforeServer");

        const rows = await knex(TABLE).select("*");

        expect(rows).toEqual([{ id: "a" }]);
        expect(events.some(event => event.type === "retry" && event.operation === "query")).toBe(
            true
        );
    });

    it("doesn't retry a write outside a transaction", async () => {
        proxy.cutOnce(/insert into/i, "beforeServer");

        await expect(knex(TABLE).insert({ id: "a" })).rejects.toThrow(/Connection terminated/);
        expect(events).toEqual([]);
    });

    it("doesn't retry errors that aren't about the connection", async () => {
        await knex(TABLE).insert({ id: "a" });
        let runs = 0;

        await expect(
            knex.transaction(async trx => {
                runs++;
                await trx(TABLE).insert({ id: "a" });
            })
        ).rejects.toThrow(/duplicate key/);
        expect(runs).toBe(1);
        expect(events).toEqual([]);
    });

    it("gives up and throws the connection error once maxRetryMs has passed", async () => {
        proxy.refuseConnections = true;
        proxy.cutOnce(/select/i, "beforeServer");
        const started = Date.now();

        try {
            await expect(knex(TABLE).select("*")).rejects.toThrow(
                /ECONNRESET|Connection terminated/
            );
        } finally {
            proxy.refuseConnections = false;
        }

        expect(Date.now() - started).toBeLessThan(3000);
        expect(events.at(-1)?.type).toBe("gaveUp");
    });
});
