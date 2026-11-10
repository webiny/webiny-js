import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { Knex } from "knex";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { startPglite } from "./startPglite.js";

/*
 * Every DynamoDB client anything builds, counted: the real class, with a counting constructor.
 */
const dynamoDb = vi.hoisted(() => ({ clients: 0 }));

vi.mock("@aws-sdk/client-dynamodb", async importOriginal => {
    const original = await importOriginal<typeof import("@aws-sdk/client-dynamodb")>();
    class DynamoDBClient extends original.DynamoDBClient {
        constructor(...args: ConstructorParameters<typeof original.DynamoDBClient>) {
            super(...args);
            dynamoDb.clients++;
        }
    }
    return { ...original, DynamoDBClient };
});

const { createAwsPgApiHandler, createAwsPgStreamApiHandler } = await import("~/index.js");

class FullCmsAccess implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[]> {
        return [{ name: "cms.*" }];
    }
}

const grantCmsAccess = createRegisterExtensionPlugin(({ container }) => {
    container.register(
        Authorizer.createImplementation({ implementation: FullCmsAccess, dependencies: [] })
    );
});

describe("the Postgres handlers and DynamoDB", () => {
    let pglite: Awaited<ReturnType<typeof startPglite>>;
    let knex: Knex;

    beforeAll(async () => {
        pglite = await startPglite();
        await pglite.setupSchema();
        knex = pglite.createKnex();
    });

    afterAll(async () => {
        await knex.destroy();
        await pglite.stop();
    });

    it("serves a CMS request without building a DynamoDB client", async () => {
        const handler = createAwsPgApiHandler({ extensions: () => [grantCmsAccess], knex });

        const result = await handler({
            httpMethod: "POST",
            path: "/cms/manage",
            headers: { "content-type": "application/json", "x-tenant": "root" },
            requestContext: { requestId: "no-dynamodb" },
            body: JSON.stringify({ query: `{ __type(name: "Mutation") { fields { name } } }` }),
            isBase64Encoded: false
        });
        const body = JSON.parse(String(result.body));

        expect(result.statusCode).toBe(200);
        expect(body.errors).toBeUndefined();
        expect(body.data.__type.fields.map((field: { name: string }) => field.name)).toContain(
            "createContentModel"
        );
        expect(dynamoDb.clients).toBe(0);
    });

    it("builds no DynamoDB client when the streaming handler is created", () => {
        createAwsPgStreamApiHandler({ extensions: () => [], knex });

        expect(dynamoDb.clients).toBe(0);
    });

    it("doesn't depend on a DynamoDB package", () => {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(import.meta.dirname, "..", "package.json"), "utf8")
        ) as { dependencies: Record<string, string> };

        expect(
            Object.keys(packageJson.dependencies).filter(name => /dynamodb|-ddb/.test(name))
        ).toEqual([]);
    });
});
