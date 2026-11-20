import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Knex } from "knex";
import type { Abstraction, Container } from "@webiny/di";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import { createAwsPgApiHandler } from "~/index.js";
import { postgresModules, startPglite } from "./startPglite.js";

/**
 * The Lambda's root container keeps only the connection: core, audit logs and the websocket
 * connection registry register in each request's container. (Identity is the project's identity
 * provider here: it has no SQL storage of its own.)
 */
const STORAGES: [string, Abstraction<unknown>][] = [
    ["core", ApiCoreStorageOperationsFactory],
    ["auditLogs", AuditLogsStorage],
    ["websockets", ConnectionRegistry]
];

const resolves = (container: Container, abstraction: Abstraction<unknown>): boolean => {
    try {
        return Boolean(container.resolve(abstraction));
    } catch {
        return false;
    }
};

describe("api-event-handler-aws-pg — storages per request", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>>;
    let knex: Knex;

    beforeAll(async () => {
        pglite = await startPglite();
        await pglite.runSchemaSetupEvent();
        knex = pglite.createKnex();
    });

    afterAll(async () => {
        await knex.destroy();
        await pglite.stop();
    });

    it("holds no storage in the root, and every storage in a request's container", async () => {
        const reports: { inRoot: string[]; inRequest: string[] }[] = [];
        const inspect = createRegisterExtensionPlugin(({ container }) => {
            // @webiny/di keeps a container's parent private; the test reads it to check the root.
            const root = (container as unknown as { parent: Container }).parent;
            reports.push({
                inRoot: STORAGES.filter(([, abstraction]) => resolves(root, abstraction)).map(
                    ([name]) => name
                ),
                inRequest: STORAGES.filter(([, abstraction]) =>
                    resolves(container, abstraction)
                ).map(([name]) => name)
            });
        });
        const handler = createAwsPgApiHandler({
            extensions: () => [...postgresModules, inspect],
            knex
        });

        const result = await handler({
            httpMethod: "POST",
            path: "/graphql",
            headers: { "content-type": "application/json", "x-tenant": "root" },
            requestContext: { requestId: "test-storages" },
            body: JSON.stringify({ query: "{ __typename }" }),
            isBase64Encoded: false
        });

        expect(result.statusCode).toBe(200);
        expect(reports).toEqual([{ inRoot: [], inRequest: ["core", "auditLogs", "websockets"] }]);
    });
});
