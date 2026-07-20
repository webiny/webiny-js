import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import type { Container } from "@webiny/di";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { GraphQLEngineFeature, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { buildSchema, getIntrospectionQuery } from "graphql";
import type { GraphQLSchema } from "graphql";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms/HeadlessCmsFeature.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types/types.js";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
import { processLegacyPlugins } from "./processLegacyPlugins.js";

const DEFAULT_IDENTITY: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const STUB_SCHEMA: GraphQLSchema = buildSchema("type Query { _empty: String }");

export interface CmsTestHandlerParams {
    /** Identity for the request. `undefined` → a default admin; `null` → anonymous. */
    identity?: IdentityData | null;
    permissions?: SecurityPermission[];
    testProjectLicense?: DecryptedWcpProjectLicense;
    /** CMS endpoint type to build. Defaults to "manage". */
    cmsType?: "manage" | "read" | "preview";
    /** Plugins forwarded to `HeadlessCmsFeature.register` as `extraPlugins` (e.g. CMS model plugins). */
    extraCmsPlugins?: any[];
    /**
     * Legacy plugins, dispatched exactly like the legacy `useContextHandler`:
     * - RegisterExtensionPlugins are applied at register() time (DI registration);
     * - static plugins (CmsModelPlugin, GraphQLSchemaPlugin, …) are forwarded to HeadlessCmsFeature
     *   as extraPlugins so their models reach the container before any initializer caches them;
     * - ContextPlugins (`.apply(ctx)`) run post-auth via a per-request initializer.
     */
    plugins?: any;
    /**
     * Register the consuming package's own features here (e.g. AcoFeature, FileModel, plus its own
     * getStorageOps presets via processLegacyPlugins). Runs in the request phase AFTER ApiCore + CMS
     * storage + HeadlessCmsFeature, and BEFORE the GraphQL engine — i.e. before any initializer or
     * resolver, the same window the real app handler uses.
     */
    features?: (container: Container) => void | Promise<void>;
}

export interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    body: { query: string; variables?: Record<string, any> };
    headers?: Record<string, string>;
}

/**
 * Shared integration test handler that wires the real CMS base (ApiCore + HeadlessCms + GraphQL
 * engine + the CMS manage route) the same way the AWS app handler does — auth via Test
 * authenticator/authorizer, root tenant seeded, storage via getStorageOps. Consuming packages add
 * their own features through `params.features` and build their SDKs on top of `invoke`/`invokeCms`,
 * or grab the fully-initialized request context via `getContext()`.
 */
export const createCmsTestHandler = (params: CmsTestHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const identity = params.identity === undefined ? DEFAULT_IDENTITY : params.identity;
    const permissions = params.permissions === undefined ? [{ name: "*" }] : params.permissions;
    const cmsType = params.cmsType ?? "manage";

    const setupRoot = (container: Container) => {
        container.registerInstance(TestIdentity, identity);
        container.registerInstance(TestPermissions, { list: permissions });
        container.register(TestAuthenticator);
        container.register(TestAuthorizer);
        container.registerDecorator(AuthTriggerHandler);
        container.registerDecorator(RootTenantInitializer);
    };

    // Everything up to (but not including) the GraphQL engine — shared by the HTTP handler and the
    // context-capture handler.
    const setupRequest = async (container: Container) => {
        const wcpLicense = await loadWcpLicense(
            params.testProjectLicense ?? createTestWcpLicense()
        );

        registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
        ApiCoreFeature.register(container, { wcpLicense });

        // CMS storage preset. All storage presets are RegisterExtensionPlugins (registerDynamoDBCore,
        // registerCmsOpenSearchStorageOperations, dbPlugins, ...); processLegacyPlugins runs them at
        // register() time — before HeadlessCmsFeature builds storage, mirroring the real app's
        // registerExtensions.
        processLegacyPlugins(container, cmsStorage.plugins);

        // DI-native plugins are plain `container => {}` functions (called last, after features);
        // legacy plugins are RegisterExtensionPlugins (register-time) or static Plugins (extraPlugins).
        const userPlugins = [params.plugins].flat(Infinity as 1).filter(Boolean);
        const isFn = (p: any) => typeof p === "function" && !p.prototype;

        const legacyUserPlugins = userPlugins.filter(p => !isFn(p));
        processLegacyPlugins(container, legacyUserPlugins);
        const staticUserPlugins = legacyUserPlugins.filter(
            p => typeof (p as any).apply !== "function" && typeof p !== "function"
        );
        HeadlessCmsFeature.register(container, {
            type: cmsType,
            extraPlugins: [...(params.extraCmsPlugins ?? []), ...staticUserPlugins]
        });

        await params.features?.(container);

        // DI-native function plugins run LAST — after the consuming package's own features — so they
        // can override defaults those features registered (last-wins).
        for (const plugin of userPlugins.filter(isFn)) {
            (plugin as (container: any) => void)(container);
        }
    };

    const handler = createTestHttpHandler({
        root: setupRoot,
        request: async container => {
            await setupRequest(container);
            GraphQLEngineFeature.register(container);
        }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {} }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: "/graphql",
            headers: { "x-tenant": "root", "content-type": "application/json", ...headers },
            body
        });
        return [response.body, response] as const;
    };

    const invokeCms = async ({
        httpMethod = "POST",
        type = "manage",
        body,
        headers = {}
    }: InvokeParams) => {
        const response = await handler({
            method: httpMethod,
            path: `/cms/${type}`,
            headers: { "x-tenant": "root", "content-type": "application/json", ...headers },
            body
        });
        return [response.body, response] as const;
    };

    /**
     * Build the request once and return the fully-initialized context (after auth, tenant, CMS and
     * all consumer features). Uses the same GraphQLContextualSchema.build(ctx) capture trick the
     * legacy `useContextHandler` does — for tests that resolve services directly off the context
     * rather than issuing GraphQL queries.
     */
    const getContext = async <
        C extends Record<string, any> = Record<string, any>
    >(): Promise<C> => {
        const captured: { value?: Record<string, any> } = {};

        const ctxHandler = createTestHttpHandler({
            root: setupRoot,
            request: async container => {
                await setupRequest(container);
                container.registerInstance(GraphQLContextualSchema, {
                    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
                        captured.value = ctx;
                        return STUB_SCHEMA;
                    }
                });
                GraphQLEngineFeature.register(container);
            }
        });

        await ctxHandler({
            method: "POST",
            path: "/graphql",
            headers: { "x-tenant": "root", "content-type": "application/json" },
            body: { query: "{ __typename }" }
        });

        return captured.value as C;
    };

    // Convenience wrappers mirroring the retired `useGraphQLHandler` — thin builders over `invoke`
    // (the main `/graphql` endpoint) so consumers can issue typed queries/mutations directly.
    const createQuery = <T extends Record<string, any> = Record<string, any>>(query: string) => {
        return (variables?: Record<string, any>, headers: Record<string, string> = {}) =>
            invoke({ body: { query, variables: variables || undefined }, headers }) as Promise<
                readonly [T, any]
            >;
    };

    const createMutation = <T extends Record<string, any> = Record<string, any>>(
        mutation: string
    ) => {
        return (variables?: Record<string, any>, headers: Record<string, string> = {}) =>
            invoke({
                body: { query: mutation, variables: variables || undefined },
                headers
            }) as Promise<readonly [T, any]>;
    };

    const introspect = () => invoke({ body: { query: getIntrospectionQuery() } });

    return {
        handler,
        invoke,
        invokeCms,
        getContext,
        createQuery,
        createMutation,
        introspect,
        identity,
        tenant: { id: "root", name: "Root", parent: null }
    };
};
