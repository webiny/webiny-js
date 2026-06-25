import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { RegisterExtensionPlugin } from "@webiny/handler";
import type { PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createTable } from "@webiny/db-dynamodb";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createEntryEntity } from "~/definitions/entry";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { CmsContext } from "~/types";
import { createIndexConfigurationPlugin } from "~tests/graphql/createIndexConfigurationPlugin";
import { TestIdentity, TestAuthenticator } from "~tests/mocks/TestAuthenticator";
import { TestPermissions, TestAuthorizer } from "~tests/mocks/TestAuthorizer";
import { processLegacyPlugins } from "~tests/helpers/bridgeLegacyPlugins";

interface UseHandlerParams {
    plugins?: PluginCollection;
    path?: "/graphql" | `/cms/manage/${Lowercase<string>}-${Uppercase<string>}`;
}

const defaultIdentity = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

// Root container is created once across all createContext() calls.
let rootContainer: Container | null = null;

export const useHandler = (params: UseHandlerParams = {}) => {
    const documentClient = getDocumentClient();
    const elasticsearchClient = createTestOpenSearchClient();

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const table = createTable({
        name: process.env.DB_TABLE as string,
        documentClient
    });
    const entryEntity = createEntryEntity({
        table,
        entityName: "CmsEntries"
    });

    const flatPlugins = ([params.plugins ?? []].flat(Infinity as 1) as any[]).filter(Boolean);
    const legacyPlugins = flatPlugins.filter(p => p instanceof RegisterExtensionPlugin);
    const extraCmsPlugins = flatPlugins.filter(p => !(p instanceof RegisterExtensionPlugin));

    const createContext = async (): Promise<CmsContext> => {
        if (!rootContainer) {
            rootContainer = new Container();
            rootContainer.registerInstance(TestIdentity, defaultIdentity);
            rootContainer.registerInstance(TestPermissions, [{ name: "*" }]);
            rootContainer.register(TestAuthenticator);
            rootContainer.register(TestAuthorizer);
        }

        const container = rootContainer.createChildContainer();
        container.registerInstance(RequestContainer, container);

        const wcpLicense = await loadWcpLicense(createTestWcpLicense());
        ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
        processLegacyPlugins(container, cmsStorage.plugins);
        processLegacyPlugins(container, legacyPlugins);
        processLegacyPlugins(container, [createIndexConfigurationPlugin()]);

        HeadlessCmsFeature.register(container, {
            type: "manage",
            extraPlugins: extraCmsPlugins
        });

        const tenantCtx = container.resolve(TenantContext);
        tenantCtx.setTenant({
            id: "root",
            name: "Root",
            description: "",
            status: "enabled",
            isInstalled: false,
            settings: {
                name: { full: "Root", slug: "root" },
                social: {},
                favicon: {},
                logo: {}
            } as any,
            tags: [],
            parent: null,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString()
        });

        const authCtx = container.resolve(AuthenticationContext);
        const identityCtx = container.resolve(IdentityContext);
        const identity = await authCtx.authenticate("");
        identityCtx.setIdentity(identity);

        const enhancers = container.resolveAll(GraphQLContextEnhancer);
        const ctx: Record<string, any> = { container };
        for (const enhancer of enhancers) {
            await enhancer.enhance(ctx);
        }
        const schemas = container.resolveAll(GraphQLContextualSchema);
        for (const schema of schemas) {
            await schema.build(ctx);
        }

        return ctx as CmsContext;
    };

    return {
        createContext,
        elasticsearch: elasticsearchClient,
        documentClient,
        table,
        entryEntity
    };
};
