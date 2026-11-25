import { describe, expect, it } from "vitest";
import { createDecorator } from "@webiny/di";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { GraphQLSchemaComposer } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import {
    CreateTenantUseCase,
    GetTenantByIdUseCase,
    InstallTenantUseCase,
    TenantScope,
    TenantScopes
} from "@webiny/api-core/exports/api/tenancy.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/abstractions.js";
import { createServer } from "./createServer.js";
import { installAndLogIn } from "./installAndLogIn.js";

/**
 * A tenant scope registers the whole feature stack, the GraphQL engine included, but builds nothing
 * until something resolves it. Code that enters another tenant's scope to run use cases (the
 * permission read from the parent tenant, the tasks that loop over every tenant) must not build that
 * tenant's GraphQL schema. The GraphQL schema composer is what every schema build starts from, so the
 * test records each scope that resolves it.
 */

const PROBE_TENANT = "schema-probe";

const createProbe = () => {
    // The tenant of each scope the composer was resolved in.
    const composerResolvedIn: string[] = [];

    class ComposerSpy {
        public constructor(scope: TenantScope.Interface | undefined, decoratee: object) {
            composerResolvedIn.push(scope?.tenant.id ?? "(no scope)");
            return decoratee;
        }
    }

    class ProbeSchema implements GraphQLSchemaFactory.Interface {
        public getSchemaKey = staticSchemaKey("tests/tenantScopeSchema");

        async execute(builder: GraphQLSchemaFactory.SchemaBuilder) {
            builder.addTypeDefs(/* GraphQL */ `
                extend type Mutation {
                    createProbeTenant: Boolean!
                }
                extend type Query {
                    runUseCasesInProbeTenant: Boolean!
                }
            `);

            builder.addResolver({
                path: "Mutation.createProbeTenant",
                dependencies: [CreateTenantUseCase, InstallTenantUseCase],
                resolver: (
                    createTenant: CreateTenantUseCase.Interface,
                    installTenant: InstallTenantUseCase.Interface
                ) => {
                    return async () => {
                        const created = await createTenant.execute({
                            id: PROBE_TENANT,
                            name: "Schema probe",
                            description: "",
                            tags: [],
                            parent: "root"
                        });
                        if (created.isFail()) {
                            throw created.error;
                        }
                        const installed = await installTenant.execute({
                            tenant: created.value,
                            installationInput: []
                        });
                        if (installed.isFail()) {
                            throw installed.error;
                        }
                        return true;
                    };
                }
            });

            builder.addResolver({
                path: "Query.runUseCasesInProbeTenant",
                dependencies: [TenantScopes, GetTenantByIdUseCase],
                resolver: (
                    tenantScopes: TenantScopes.Interface,
                    getTenantById: GetTenantByIdUseCase.Interface
                ) => {
                    return async () => {
                        const tenant = await getTenantById.execute(PROBE_TENANT);
                        if (tenant.isFail()) {
                            throw tenant.error;
                        }
                        return tenantScopes.withTenant(tenant.value, async scope => {
                            const roles = await scope.resolve(ListRolesUseCase).execute();
                            const models = await scope.resolve(ListModelsUseCase).execute();
                            return roles.isOk() && models.isOk();
                        });
                    };
                }
            });

            return builder;
        }
    }

    const ProbeSchemaImpl = GraphQLSchemaFactory.createImplementation({
        implementation: ProbeSchema,
        dependencies: []
    });

    const extension = createRegisterExtensionPlugin(({ container }) => {
        container.register(ProbeSchemaImpl);
        container.registerDecorator(
            createDecorator({
                abstraction: GraphQLSchemaComposer,
                decorator: ComposerSpy,
                dependencies: [[TenantScope, { optional: true }]]
            })
        );
    });

    return { extension, composerResolvedIn };
};

describe("api-composition-standalone-sql — tenant scope schema", () => {
    it("builds no GraphQL schema for a tenant scope that only runs use cases", async () => {
        const { extension, composerResolvedIn } = createProbe();
        const server = await createServer(() => [extension]);

        try {
            const token = await installAndLogIn(server);

            const created = await server.graphql("mutation { createProbeTenant }", {}, token);
            expect(created.body).toEqual({ data: { createProbeTenant: true } });

            const run = await server.graphql("{ runUseCasesInProbeTenant }", {}, token);
            expect(run.body).toEqual({ data: { runUseCasesInProbeTenant: true } });
        } finally {
            await server.close();
        }

        // Every GraphQL request resolved the composer in the root tenant's scope, the request's own.
        expect(composerResolvedIn.length).toBeGreaterThan(0);
        expect(new Set(composerResolvedIn)).toEqual(new Set(["root"]));
        // Installing the probe tenant and running its use cases built its scope, but no schema.
        expect(composerResolvedIn).not.toContain(PROBE_TENANT);
    });
});
