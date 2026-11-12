import { describe, expect, it } from "vitest";
import type { Knex } from "knex";
import { createServer } from "./createServer.js";

/**
 * The server sets its schema up at start, before it takes a request, on a container built the way a
 * request's is. So the storage, given no extensions, still creates the tables of everything the API
 * runs: its own parts, the transport's login storage and the CMS and ACO.
 */

const listTables = async (knex: Knex): Promise<string[]> => {
    const rows: { name: string }[] = await knex("sqlite_master")
        .where("type", "table")
        .whereNot("name", "like", "sqlite_%")
        .select("name");
    return rows.map(row => row.name);
};

describe("api-event-handler-standalone-sql — schema setup at start", () => {
    it("on SQLite, creates the tables of core, audit logs, websockets, login, the CMS and ACO before any request", async () => {
        const server = await createServer();

        try {
            expect(await listTables(server.knex)).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/webiny_service_manifests$/),
                    expect.stringMatching(/webiny_audit_logs$/),
                    expect.stringMatching(/WebsocketsConnections$/),
                    expect.stringMatching(/webiny_self_hosted_credentials$/),
                    expect.stringMatching(/webiny_self_hosted_password_reset_codes$/),
                    expect.stringMatching(/cms.*models/i),
                    expect.stringMatching(/cms.*groups/i),
                    expect.stringMatching(/cms.*entries/i),
                    expect.stringMatching(/webiny_aco_flp$/)
                ])
            );
        } finally {
            await server.close();
        }
    });
});
