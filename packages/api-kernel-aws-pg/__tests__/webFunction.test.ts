import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type http from "node:http";
import type { AddressInfo } from "node:net";
import type { Knex } from "knex";
import { createWebinyWebApiHandler } from "@webiny/api-kernel-aws";
import { startAwsPgWebApi } from "~/index.js";
import { storageConfig } from "~/storageConfig.js";
import { postgresModules, startPglite } from "./startPglite.js";

/**
 * The Lambda web function serves the API's HTTP routes, so on `<Infra.AuroraPostgres />` it has to
 * run on Postgres like the Lambda handlers. `startAwsPgWebApi` is `createWebinyWebApiHandler` with
 * this package's storage plus `listen`; the test builds the same server so it can close it later.
 */
describe("api-kernel-aws-pg — web function", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>>;
    let knex: Knex;
    let server: http.Server;
    let queries = 0;

    beforeAll(async () => {
        pglite = await startPglite();
        await pglite.runSchemaSetupEvent();
        knex = pglite.createKnex();
        knex.on("query", () => {
            queries++;
        });

        server = await createWebinyWebApiHandler(
            storageConfig({ extensions: () => [...postgresModules], knex })
        );
        await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    });

    afterAll(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
        await knex.destroy();
        await pglite.stop();
    });

    it("exports the web function's entry", () => {
        expect(typeof startAwsPgWebApi).toBe("function");
    });

    it("answers GraphQL over HTTP from Postgres", async () => {
        const { port } = server.address() as AddressInfo;
        const before = queries;

        const response = await fetch(`http://127.0.0.1:${port}/graphql`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-tenant": "root" },
            body: JSON.stringify({ query: "{ __typename }" })
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ data: { __typename: "Query" } });
        // The tenant is loaded from storage on every request; on Postgres that is a knex query.
        expect(queries).toBeGreaterThan(before);
    });
});
