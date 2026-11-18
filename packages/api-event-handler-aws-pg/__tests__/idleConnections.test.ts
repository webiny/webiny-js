import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import net from "node:net";
import type { Knex } from "knex";
import { createLambdaPgConnection } from "~/connection/createLambdaPgConnection.js";
import { startPglite } from "./startPglite.js";

/**
 * A Lambda execution environment is frozen between requests: no timer or socket event runs, so
 * the pool doesn't see a connection the server ended in the meantime (an idle-session timeout,
 * a failover, a network path that dropped an idle flow). These tests freeze the environment by
 * moving the clock on, and end the pooled connection behind a proxy without telling the client,
 * which is what the client finds when it thaws. Retries are off: the pool alone must not hand
 * such a connection to the next request.
 */

/* How the proxy ends a connection without the client seeing it. */
type UnseenEnd =
    /* The server is gone: the client's next packet is answered by a closed connection. */
    | "closed"
    /* The server is gone and nothing answers: the client's packets, its goodbye too, are lost. */
    | "silent";

interface ILink {
    client: net.Socket;
    upstream: net.Socket;
    ended?: UnseenEnd;
}

/* A TCP proxy in front of the database that can end its connections behind the client's back. */
class FreezingProxy {
    public port = 0;
    /** Connections the proxy accepted so far: a new one means the pool opened a new connection. */
    public opened = 0;
    /** What clients sent since the last `clearSent()`, as text, whether it reached the server or not. */
    public sent = "";
    // Half-open, so a client's FIN isn't answered for it: a silent end never answers it.
    private readonly server = net.createServer({ allowHalfOpen: true }, client =>
        this.handle(client)
    );
    private readonly links = new Set<ILink>();

    public constructor(private readonly targetPort: number) {}

    public async start(): Promise<void> {
        await new Promise<void>(resolve => this.server.listen(0, "127.0.0.1", resolve));
        this.port = (this.server.address() as net.AddressInfo).port;
    }

    public async stop(): Promise<void> {
        for (const link of this.links) {
            link.client.destroy();
            link.upstream.destroy();
        }
        await new Promise(resolve => this.server.close(resolve));
    }

    public clearSent(): void {
        this.sent = "";
    }

    /** Ends every open connection on the server's side; the clients don't see it until they write. */
    public endUnseen(how: UnseenEnd): void {
        for (const link of this.links) {
            link.ended = how;
            link.upstream.destroy();
        }
    }

    private handle(client: net.Socket): void {
        this.opened++;
        const upstream = net.connect(this.targetPort, "127.0.0.1");
        const link: ILink = { client, upstream };
        this.links.add(link);
        const close = () => {
            client.destroy();
            upstream.destroy();
            this.links.delete(link);
        };
        client.on("data", chunk => {
            if (link.ended === "closed") {
                close();
                return;
            }
            this.sent += chunk.toString("latin1");
            if (link.ended === "silent") {
                return;
            }
            upstream.write(chunk);
        });
        upstream.on("data", chunk => {
            if (!link.ended) {
                client.write(chunk);
            }
        });
        // The client closed its side (after a Terminate): a server that's there closes too.
        client.on("end", () => {
            if (link.ended !== "silent") {
                close();
            }
        });
        client.on("close", close);
        client.on("error", close);
        upstream.on("error", () => undefined);
        upstream.on("close", () => {
            if (!link.ended) {
                close();
            }
        });
    }
}

const TABLE = "idle_connection_items";

/* The query the pool sends to check a connection before handing it out. */
const CHECK_QUERY = /SELECT 1\b/;

describe("a pooled connection in a Lambda environment", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>>;
    let proxy: FreezingProxy;
    let knex: Knex;
    let clockOffsetMs = 0;
    const realNow = Date.now;
    const savedEnv = { ...process.env };

    /** The environment sits frozen for `ms`: nothing runs, and the clock moves on. */
    const freezeFor = (ms: number) => {
        clockOffsetMs += ms;
    };

    /** Opens the pool's connection with a write, and leaves it idle in the pool. */
    const useConnection = async () => {
        await knex(TABLE).insert({ id: `row-${proxy.opened}-${realNow()}` });
    };

    beforeAll(async () => {
        // A pool opens several connections in one test.
        pglite = await startPglite({ maxConnections: 8 });
        proxy = new FreezingProxy(Number(pglite.env.WEBINY_PG_PORT));
        await proxy.start();
        // Postgres settings from the shell or a `.env` (a connection string beats the host and port
        // below, an SSL mode changes the connection) would send this suite's writes elsewhere.
        // `afterAll` puts them back.
        for (const name of Object.keys(process.env)) {
            if (/^WEBINY_PG_|^PG[A-Z]+$/.test(name)) {
                delete process.env[name];
            }
        }
        Object.assign(process.env, {
            WEBINY_PG_HOST: "127.0.0.1",
            WEBINY_PG_PORT: String(proxy.port),
            WEBINY_PG_USER: "postgres",
            WEBINY_PG_PASSWORD: "postgres",
            WEBINY_PG_DATABASE: "postgres",
            // A plain Lambda function's pool; one test sets the web function's.
            WEBINY_PG_POOL_MAX: "1",
            // No retries: what's tested is that the pool never hands out a dead connection.
            WEBINY_PG_RETRY_MS: "0"
        });
        const setup = pglite.createKnex();
        await setup.raw(`CREATE TABLE "${TABLE}" (id text PRIMARY KEY)`);
        await setup.destroy();
    });

    afterAll(async () => {
        process.env = savedEnv;
        await proxy?.stop();
        await pglite?.stop();
    });

    beforeEach(() => {
        clockOffsetMs = 0;
        vi.spyOn(Date, "now").mockImplementation(() => realNow() + clockOffsetMs);
        knex = createLambdaPgConnection();
    });

    afterEach(async () => {
        await knex.destroy();
        vi.restoreAllMocks();
    });

    const operations: Record<string, () => Promise<unknown>> = {
        write: () => knex(TABLE).insert({ id: "after-thaw" }),
        read: () => knex(TABLE).select("id"),
        transaction: () =>
            knex.transaction(async trx => {
                await trx(TABLE).insert({ id: "after-thaw-trx" });
                return trx(TABLE).select("id");
            })
    };

    it.each(Object.keys(operations))(
        "isn't handed to the next %s after the server ended it while the environment was frozen",
        async name => {
            await useConnection();
            const opened = proxy.opened;

            freezeFor(5_000);
            proxy.endUnseen("closed");

            await expect(operations[name]()).resolves.toBeDefined();
            expect(proxy.opened).toBe(opened + 1);
            await knex(TABLE).delete();
        }
    );

    it("is dropped when the server no longer answers, and the next write succeeds", async () => {
        await useConnection();
        const opened = proxy.opened;

        freezeFor(5_000);
        proxy.endUnseen("silent");

        const started = realNow();
        await knex(TABLE).insert({ id: "after-silence" });
        // The check gives up after 2 s.
        expect(realNow() - started).toBeLessThan(4_000);
        expect(proxy.opened).toBe(opened + 1);
        await knex(TABLE).delete();
    }, 10_000);

    it("is dropped with every connection idle as long, so one write waits for one check only", async () => {
        // The web function's pool, with all eight connections open and idle.
        await knex.destroy();
        process.env.WEBINY_PG_POOL_MAX = "8";
        try {
            knex = createLambdaPgConnection();
        } finally {
            process.env.WEBINY_PG_POOL_MAX = "1";
        }
        const client = knex.client as {
            acquireConnection(): Promise<object>;
            releaseConnection(connection: object): Promise<unknown>;
        };
        // All eight held at once; whatever was acquired is released even if one acquire failed.
        const acquired = await Promise.allSettled(
            Array.from({ length: 8 }, () => client.acquireConnection())
        );
        await Promise.all(
            acquired
                .filter(result => result.status === "fulfilled")
                .map(result => client.releaseConnection(result.value))
        );
        for (const result of acquired) {
            if (result.status === "rejected") {
                throw result.reason;
            }
        }
        const opened = proxy.opened;
        proxy.clearSent();

        freezeFor(5_000);
        proxy.endUnseen("silent");

        // One check after another would take 8 x 2 s, past the pool's 15 s acquire timeout.
        const started = realNow();
        await knex(TABLE).insert({ id: "after-silence-8" });
        expect(realNow() - started).toBeLessThan(4_000);
        expect(proxy.sent.match(new RegExp(CHECK_QUERY, "g"))).toHaveLength(1);
        expect(proxy.opened).toBe(opened + 1);
        await knex(TABLE).delete();
    }, 20_000);

    it("is kept when it answers the check", async () => {
        await useConnection();
        const opened = proxy.opened;
        proxy.clearSent();

        freezeFor(5_000);
        await knex(TABLE).select("id");

        expect(proxy.sent).toMatch(CHECK_QUERY);
        expect(proxy.opened).toBe(opened);
        await knex(TABLE).delete();
    });

    it("isn't checked when it was used moments ago", async () => {
        await useConnection();
        const opened = proxy.opened;
        proxy.clearSent();

        freezeFor(500);
        await knex(TABLE).select("id");

        expect(proxy.sent).not.toMatch(CHECK_QUERY);
        expect(proxy.opened).toBe(opened);
        await knex(TABLE).delete();
    });

    it("is replaced without a check after sitting idle longer than the pool keeps one", async () => {
        await useConnection();
        const opened = proxy.opened;
        proxy.clearSent();

        // Longer than the pool's 60 s idle timeout, whose reaping didn't run while frozen. The
        // connection is gone without a word (a network path that dropped the idle flow), so a
        // check would wait for its timeout.
        freezeFor(61_000);
        proxy.endUnseen("silent");

        const started = realNow();
        await knex(TABLE).select("id");
        expect(realNow() - started).toBeLessThan(1_000);
        expect(proxy.sent).not.toMatch(CHECK_QUERY);
        expect(proxy.opened).toBe(opened + 1);
        await knex(TABLE).delete();
    });

    it("is closed within a second when it's dropped and nothing answers its goodbye", async () => {
        // The pool's connection, held on to so its socket can be watched after it's dropped.
        const client = knex.client as {
            acquireConnection(): Promise<{ connection: { stream: net.Socket } }>;
            releaseConnection(connection: object): Promise<unknown>;
        };
        const connection = await client.acquireConnection();
        await client.releaseConnection(connection);
        const socket = connection.connection.stream;
        proxy.clearSent();

        // Dropped without a check, so no query is running on it when it's closed.
        freezeFor(61_000);
        proxy.endUnseen("silent");
        await knex(TABLE).select("id");

        // The goodbye is sent (Terminate), but nothing closes the server's side.
        expect(proxy.sent).toContain("X\0\0\0\x04");
        await vi.waitFor(() => expect(socket.destroyed).toBe(true), {
            timeout: 3_000,
            interval: 50
        });
    });
});
