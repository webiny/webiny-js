import { describe, test, expect } from "vitest";
import { GraphQLSchemaCacheFeature } from "@webiny/api-graphql";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.public.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { useGqlHandler } from "../useGqlHandler";

/**
 * Reads IdentityContext and TenantContext in two ways: through `addResolver({ dependencies })`,
 * which resolves them from the current handler execution, and through the factory's constructor, which holds
 * the instances of the handler execution that built the cached schema.
 */
class WhoAmISchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                whoAmI: String
                whoAmIFromConstructor: String
                tenantFromConstructor: String
            }
        `);

        builder.addResolver({
            path: "Query.whoAmI",
            dependencies: [IdentityContext],
            resolver: (identityContext: IdentityContext.Interface) => () => {
                return identityContext.getIdentity().id;
            }
        });

        builder.addResolver({
            path: "Query.whoAmIFromConstructor",
            resolver: () => () => {
                return this.identityContext.getIdentity().id;
            }
        });

        builder.addResolver({
            path: "Query.tenantFromConstructor",
            resolver: () => () => {
                return this.tenantContext.getTenant().id;
            }
        });

        return builder;
    }
}

const WhoAmISchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: WhoAmISchemaFactoryImpl,
    dependencies: [IdentityContext, TenantContext]
});

const ADMIN_ID = "123456789";
const ANONYMOUS = { authorization: "anonymous" };

describe("Services used after their handler execution", () => {
    /*
     * A new handler per test, so the first query of each test is the request that builds and
     * caches the schema.
     */
    const createQuery = () => {
        const { invoke } = useGqlHandler({
            registrations: [WhoAmISchemaFactory],
            rootRegistrations: [container => GraphQLSchemaCacheFeature.register(container)]
        });

        return (field: string, headers: Record<string, string> = {}) => {
            return invoke({ body: { query: `{ ${field} }` }, headers });
        };
    };

    test("resolver dependencies come from the current handler execution", async () => {
        const query = createQuery();
        const [admin] = await query("whoAmI");
        expect(admin.data.whoAmI).toBe(ADMIN_ID);

        const [anonymous] = await query("whoAmI", ANONYMOUS);
        expect(anonymous.data.whoAmI).not.toBe(ADMIN_ID);
    });

    test("an anonymous request can't use the IdentityContext of an earlier admin request", async () => {
        const query = createQuery();
        // The admin request builds and caches the schema.
        const [admin] = await query("whoAmIFromConstructor");
        expect(admin.errors).toBeUndefined();
        expect(admin.data.whoAmIFromConstructor).toBe(ADMIN_ID);

        const [anonymous] = await query("whoAmIFromConstructor", ANONYMOUS);
        expect(anonymous.data.whoAmIFromConstructor).toBeNull();
        expect(anonymous.errors[0].message).toContain(
            "IdentityContext belongs to handler execution"
        );
    });

    test("an admin request can't use the IdentityContext of an earlier anonymous request", async () => {
        const query = createQuery();
        const [anonymous] = await query("whoAmIFromConstructor", ANONYMOUS);
        expect(anonymous.errors).toBeUndefined();

        const [admin] = await query("whoAmIFromConstructor");
        expect(admin.data.whoAmIFromConstructor).toBeNull();
        expect(admin.errors[0].message).toContain("IdentityContext belongs to handler execution");
    });

    test("a request can't use the TenantContext of an earlier request", async () => {
        const query = createQuery();
        const [first] = await query("tenantFromConstructor");
        expect(first.data.tenantFromConstructor).toBe("root");

        const [second] = await query("tenantFromConstructor");
        expect(second.data.tenantFromConstructor).toBeNull();
        expect(second.errors[0].message).toContain("TenantContext belongs to handler execution");
    });
});
