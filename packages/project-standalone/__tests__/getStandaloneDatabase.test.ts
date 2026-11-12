import path from "node:path";
import { describe, expect, it } from "vitest";
import { ProjectConfigModel } from "@webiny/project/models/ProjectConfigModel.js";
import { getStandaloneDatabase } from "~/deploy/getStandaloneDbDriver.js";

/** A project config holding the given extension instances, as `GetProjectConfigService` returns it. */
const configWith = (extensions: Record<string, Array<{ params: Record<string, unknown> }>>) => ({
    execute: async () => ProjectConfigModel.create(extensions as any)
});

const postgres = { host: "db", port: 5432, user: "u", password: "p", database: "webiny" };

describe("getStandaloneDatabase", () => {
    it("connects to Postgres", async () => {
        const database = await getStandaloneDatabase(
            configWith({ "Infra/Postgres": [{ params: postgres }] }) as any
        );
        expect(database).toEqual({ driver: "postgres" });
    });

    it("connects to SQLite", async () => {
        const database = await getStandaloneDatabase(
            configWith({ "Infra/Sqlite": [{ params: { filename: "db.sqlite" } }] }) as any
        );
        expect(database).toEqual({ driver: "sqlite" });
    });

    it("runs PGlite as Postgres", async () => {
        const defaults = await getStandaloneDatabase(
            configWith({ "Infra/Pglite": [{ params: {} }] }) as any
        );
        expect(defaults).toEqual({
            driver: "postgres",
            // No port configured: a free one is picked when the database starts.
            pglite: { port: null, dataDir: path.join(process.cwd(), ".webiny/postgres") }
        });

        const custom = await getStandaloneDatabase(
            configWith({
                "Infra/Pglite": [{ params: { port: 6000, dataDir: "/data/pg" } }]
            }) as any
        );
        expect(custom.pglite).toEqual({ port: 6000, dataDir: "/data/pg" });
    });

    it("requires exactly one database", async () => {
        await expect(getStandaloneDatabase(configWith({}) as any)).rejects.toThrow(
            "No database configured"
        );
        await expect(
            getStandaloneDatabase(
                configWith({
                    "Infra/Postgres": [{ params: postgres }],
                    "Infra/Pglite": [{ params: {} }]
                }) as any
            )
        ).rejects.toThrow("<Infra.Postgres> and <Infra.Pglite> are configured");
    });
});
