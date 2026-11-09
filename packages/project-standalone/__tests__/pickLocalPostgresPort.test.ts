import net from "node:net";
import { describe, expect, it } from "vitest";
import { pickLocalPostgresPort } from "~/serve/spawnLocalPostgres.js";

const listen = (port: number, host: string): Promise<net.Server> =>
    new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once("error", reject);
        server.listen(port, host, () => resolve(server));
    });

const close = (server: net.Server): Promise<void> =>
    new Promise(resolve => server.close(() => resolve()));

describe("pickLocalPostgresPort", () => {
    it("uses a configured port as is", async () => {
        await expect(pickLocalPostgresPort({ port: 6000, dataDir: "/data" })).resolves.toBe(6000);
    });

    it("skips a port another process holds on 127.0.0.1", async () => {
        const first = await pickLocalPostgresPort({ port: null, dataDir: "/data" });
        expect(first).toBeGreaterThanOrEqual(54320);

        // Held on 127.0.0.1 only, where the database binds: a wildcard probe alone would miss it.
        const holder = await listen(first, "127.0.0.1");
        try {
            const next = await pickLocalPostgresPort({ port: null, dataDir: "/data" });
            expect(next).toBeGreaterThan(first);
        } finally {
            await close(holder);
        }
    });
});
