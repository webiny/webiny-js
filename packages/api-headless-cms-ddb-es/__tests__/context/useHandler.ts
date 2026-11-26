import { createTestHttpHandler } from "@webiny/api-kernel-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { CreateTenantUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { RegisterExtensionPlugin } from "@webiny/handler";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { SearchIndexTasksFeature } from "@webiny/api-search-index-tasks";
import { SearchIndexTasksDdbOsFeature } from "@webiny/api-search-index-tasks-ddb-os";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import type { ApiCoreStorageOperationsBuilder } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import type { Container } from "@webiny/di";
import type { CmsContext } from "~/types";
import { TestIdentity, TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions, TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { TestTenantScopesFeature, createTenantScopedChild } from "@webiny/api-core-testing";
import { processLegacyPlugins } from "~tests/helpers/bridgeLegacyPlugins";
import type { CreateTenantInput } from "@webiny/api-core/types/tenancy.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { NullLogger } from "@webiny/api-core/features/logger/index.js";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: string;
}

export const defaultIdentity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const TENANTS = [
    { id: "root", name: "Root", parent: "" },
    { id: "webiny", name: "Webiny", parent: "" },
    { id: "dev", name: "Dev", parent: "" },
    { id: "sales", name: "Sales", parent: "" }
] as CreateTenantInput[];

export const useHandler = <C extends CmsContext = CmsContext>(params: CreateHandlerCoreParams) => {
    const elasticsearchClient = createTestOpenSearchClient();

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperationsBuilder>("apiCore");
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity = params.identity ?? defaultIdentity;
    const resolvedPermissions = (params.permissions ?? [{ name: "*" }]) as SecurityPermission[];

    const flatPlugins = ([params.plugins ?? []].flat(Infinity as 1) as any[]).filter(Boolean);
    const legacyPlugins = flatPlugins.filter(p => p instanceof RegisterExtensionPlugin);
    const extraCmsPlugins = flatPlugins.filter(p => !(p instanceof RegisterExtensionPlugin));

    // The request's own scope (the root tenant's): the first scope the request builds.
    let requestScope: Container | null = null;

    /*
     * Requests run the way the API runs them: the request container is tenant-neutral, and the
     * request continues in the scope of its `x-tenant` header's tenant. Work in another tenant
     * (`TenantScopes.withTenant()`, as the index tasks do for every tenant) builds that tenant's
     * scope the same way.
     */
    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, { list: resolvedPermissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            TestTenantScopesFeature.register(container);
        },
        child: createTenantScopedChild({
            request: async container => {
                await WcpLicenseLoader.load(createTestWcpLicense());
                registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
                container.registerInstance(Logger, new NullLogger());
            },
            scope: container => {
                const wcpLicense = WcpLicenseLoader.getCached();
                ApiCoreFeature.register(container, { wcpLicense, tenantScope: true });
                processLegacyPlugins(container, cmsStorage.plugins);
                processLegacyPlugins(container, legacyPlugins);

                HeadlessCmsFeature.register(container, {
                    type: "manage",
                    extraPlugins: extraCmsPlugins
                });

                ProcessEnvFeature.register(container);
                BackgroundTasksFeature.register(container);
                TimerFeature.register(container, timerFactory());
                SearchIndexTasksFeature.register(container);
                SearchIndexTasksDdbOsFeature.register(container);

                requestScope ??= container;

                GraphQLEngineFeature.register(container);
            }
        })
    });

    const buildContext = async (): Promise<C> => {
        requestScope = null;
        await handler({
            method: "POST",
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token"
            },
            body: { query: "{ __typename }" }
        });
        const container = requestScope! as Container;

        const createTenantUseCase = container.resolve(CreateTenantUseCase);
        for (const tenant of TENANTS) {
            try {
                await createTenantUseCase.execute(tenant);
            } catch {
                // Tenant may already exist in DynamoDB
            }
        }

        const ctx: Record<string, any> = { container };

        return ctx as C;
    };

    return {
        elasticsearch: elasticsearchClient,
        handler: (_payload?: any) => buildContext()
    };
};
