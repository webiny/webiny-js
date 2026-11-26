import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { HttpAllowedRequestHeaders } from "@webiny/api-kernel-core";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import {
    CreateTenantUseCase,
    InstallTenantUseCase,
    TenantScope,
    UpdateTenantUseCase
} from "@webiny/api-core/exports/api/tenancy.js";
import { JwtIdentityProvider } from "@webiny/api-core/idp/index.js";
import { AuthenticationError } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { createServer } from "./createServer.js";
import { installAndLogIn } from "./installAndLogIn.js";

/**
 * The HTTP request path through the full standalone server: CORS and the tenant step run at request
 * level, before any tenant scope is built, and only then does the request enter its tenant's scope.
 * Each run of the extension's callback is recorded with the container it ran in: a tenant's scope, or
 * a container with no tenant, built at start: the throwaway one the CORS allowed headers are read
 * from once per process, and the SQL schema setup's.
 */

const ORIGIN = "https://admin.example.com";
const DISABLED_TENANT = "disabled-probe";
const REJECTING_ISSUER = "https://rejecting-idp.example.com";

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

// A token of the rejecting identity provider below. Its signature is never checked.
const REJECTED_TOKEN = [
    base64url({ alg: "HS256", typ: "JWT" }),
    base64url({ iss: REJECTING_ISSUER, sub: "user-1" }),
    "signature"
].join(".");

const createProbe = () => {
    const extensionRuns: string[] = [];

    class ProbeSchema implements GraphQLSchemaFactory.Interface {
        public getSchemaKey = staticSchemaKey("tests/httpTenantScope");

        async execute(builder: GraphQLSchemaFactory.SchemaBuilder) {
            builder.addTypeDefs(/* GraphQL */ `
                extend type Mutation {
                    createDisabledProbeTenant: Boolean!
                }
            `);
            builder.addResolver({
                path: "Mutation.createDisabledProbeTenant",
                dependencies: [CreateTenantUseCase, InstallTenantUseCase, UpdateTenantUseCase],
                resolver: (
                    createTenant: CreateTenantUseCase.Interface,
                    installTenant: InstallTenantUseCase.Interface,
                    updateTenant: UpdateTenantUseCase.Interface
                ) => {
                    return async () => {
                        const created = await createTenant.execute({
                            id: DISABLED_TENANT,
                            name: "Disabled probe",
                            description: "",
                            tags: [],
                            parent: "root"
                        });
                        if (created.isFail()) {
                            throw created.error;
                        }
                        // Only an installed tenant counts as disabled.
                        const installed = await installTenant.execute({
                            tenant: created.value,
                            installationInput: []
                        });
                        if (installed.isFail()) {
                            throw installed.error;
                        }
                        const updated = await updateTenant.execute(DISABLED_TENANT, {
                            status: "disabled"
                        });
                        if (updated.isFail()) {
                            throw updated.error;
                        }
                        return true;
                    };
                }
            });
            return builder;
        }
    }

    const extension = createRegisterExtensionPlugin(({ container }) => {
        const [scope] = container.resolveAll(TenantScope);
        extensionRuns.push(scope ? `scope:${scope.tenant.id}` : "no tenant");

        container.registerInstance(HttpAllowedRequestHeaders, { headers: ["X-Probe-Header"] });
        // An identity provider that rejects its own tokens, the way one rejects an expired one.
        container.registerInstance(JwtIdentityProvider, {
            isApplicable: payload => payload.iss === REJECTING_ISSUER,
            getIdentity: async () => {
                const expired = Object.assign(new Error("jwt expired"), {
                    name: "TokenExpiredError"
                });
                throw AuthenticationError.from(expired);
            }
        });
        container.register(
            GraphQLSchemaFactory.createImplementation({
                implementation: ProbeSchema,
                dependencies: []
            })
        );
    });

    return { extension, extensionRuns };
};

describe("api-composition-standalone-sql — HTTP requests and tenant scopes", () => {
    let probe: ReturnType<typeof createProbe>;
    let server: Awaited<ReturnType<typeof createServer>>;
    let token: string;

    const send = (method: string, headers: Record<string, string>) => {
        return fetch(`http://127.0.0.1:${server.port}/graphql`, {
            method,
            headers: { origin: ORIGIN, ...headers },
            body: method === "OPTIONS" ? undefined : JSON.stringify({ query: "{ __typename }" })
        });
    };

    // The runs of the extension's callback from here on.
    const runsDuring = async (cb: () => Promise<void>) => {
        const before = probe.extensionRuns.length;
        await cb();
        return probe.extensionRuns.slice(before);
    };

    beforeEach(async () => {
        probe = createProbe();
        server = await createServer(() => [probe.extension]);
        token = await installAndLogIn(server);
        // ErrorResponseDecorator logs the errors it answers with a 500.
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(async () => {
        await server.close();
        vi.restoreAllMocks();
    });

    it("runs the extensions with no tenant only at start, not per request", async () => {
        const atStart = probe.extensionRuns.filter(run => run === "no tenant").length;

        const runs = await runsDuring(async () => {
            await server.graphql("{ __typename }", {}, token);
            await server.graphql("{ __typename }", {}, token);
        });

        // The CORS allowed headers' container, and the SQL schema setup's.
        expect(atStart).toBe(2);
        // Every request built its own tenant scope, and the extension registered in it.
        expect(runs).toEqual(["scope:root", "scope:root"]);
    });

    it("answers a CORS preflight with the extensions' allowed headers, building no tenant scope", async () => {
        const responses: Response[] = [];
        const runs = await runsDuring(async () => {
            responses.push(await send("OPTIONS", { "access-control-request-method": "POST" }));
            responses.push(
                await send("OPTIONS", {
                    "access-control-request-method": "POST",
                    "x-tenant": "root"
                })
            );
        });

        for (const response of responses) {
            expect(response.status).toBe(204);
            expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
            expect(response.headers.get("access-control-allow-headers")).toContain(
                "x-probe-header"
            );
        }
        expect(runs).toEqual([]);
    });

    it("answers an unknown tenant with a 500 and the CORS headers, building no tenant scope", async () => {
        let response: Response | undefined;
        const runs = await runsDuring(async () => {
            response = await send("POST", {
                "content-type": "application/json",
                "x-tenant": "no-such-tenant"
            });
        });

        expect(response!.status).toBe(500);
        expect(response!.headers.get("access-control-allow-origin")).toBe(ORIGIN);
        expect(runs).toEqual([]);
    });

    it("answers a disabled tenant with a 500 and the CORS headers, building no tenant scope", async () => {
        const created = await server.graphql("mutation { createDisabledProbeTenant }", {}, token);
        expect(created.body).toEqual({ data: { createDisabledProbeTenant: true } });

        let response: Response | undefined;
        const runs = await runsDuring(async () => {
            response = await send("POST", {
                "content-type": "application/json",
                "x-tenant": DISABLED_TENANT
            });
        });

        expect(response!.status).toBe(500);
        expect(response!.headers.get("access-control-allow-origin")).toBe(ORIGIN);
        expect(runs).toEqual([]);
    });

    it("answers a rejected token with a 401 and the CORS headers, from the tenant's scope", async () => {
        let response: Response | undefined;
        const runs = await runsDuring(async () => {
            response = await send("POST", {
                "content-type": "application/json",
                "x-tenant": "root",
                authorization: `Bearer ${REJECTED_TOKEN}`
            });
        });

        expect(response!.status).toBe(401);
        expect(response!.headers.get("access-control-allow-origin")).toBe(ORIGIN);
        // The identity loads in the tenant's scope: the request built it.
        expect(runs).toEqual(["scope:root"]);
    });

    it("runs a signed-in request's route in its tenant's scope", async () => {
        let response: Awaited<ReturnType<typeof server.graphql>> | undefined;
        const runs = await runsDuring(async () => {
            response = await server.graphql("{ __typename }", {}, token);
        });

        expect(response!.statusCode).toBe(200);
        expect(response!.body).toEqual({ data: { __typename: "Query" } });
        expect(runs).toEqual(["scope:root"]);
    });
});
