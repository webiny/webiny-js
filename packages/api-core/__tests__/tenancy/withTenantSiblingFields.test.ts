import { describe } from "vitest";
import { test } from "vitest";
import { expect } from "vitest";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.public.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import { useGqlHandler } from "../useGqlHandler";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const otherTenant: Tenant = {
    id: "other-tenant",
    name: "Other tenant",
    parent: "root",
    isInstalled: true,
    createdOn: new Date().toISOString(),
    description: "",
    settings: {},
    tags: [],
    status: "active",
    savedOn: new Date().toISOString()
};

/**
 * Two root query fields resolved concurrently by graphql-js within one request: `switchTenant` holds
 * a `withTenant()` callback open for 20ms, and `readTenant` reads the tenant 5ms in, while that
 * callback is still running.
 */
class SiblingFieldsSchemaImpl implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                switchTenant: String
                readTenant: String
            }
        `);

        builder.addResolver({
            path: "Query.switchTenant",
            dependencies: [TenantContext],
            resolver: (tenantContext: TenantContext.Interface) => async () => {
                return tenantContext.withTenant(otherTenant, async tenant => {
                    await wait(20);
                    return tenant.id;
                });
            }
        });

        builder.addResolver({
            path: "Query.readTenant",
            dependencies: [TenantContext],
            resolver: (tenantContext: TenantContext.Interface) => async () => {
                await wait(5);
                return tenantContext.getTenant().id;
            }
        });

        return builder;
    }
}

const SiblingFieldsSchema = GraphQLSchemaFactory.createImplementation({
    implementation: SiblingFieldsSchemaImpl,
    dependencies: []
});

describe("TenantContext.withTenant() and sibling GraphQL fields", () => {
    test("a sibling field keeps reading the request's own tenant", async () => {
        const { invoke } = useGqlHandler({ registrations: [SiblingFieldsSchema] });

        const [response] = await invoke({ body: { query: "{ switchTenant readTenant }" } });

        expect(response.errors).toBeUndefined();
        expect(response.data.switchTenant).toBe("other-tenant");
        expect(response.data.readTenant).toBe("root");
    });
});
