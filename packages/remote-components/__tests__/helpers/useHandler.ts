import { createTestHttpHandler } from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature } from "@webiny/api-core";
import { registerApiCoreStorageOperations } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { TestIdentity } from "@webiny/api-core-testing";
import { TestAuthenticator } from "@webiny/api-core-testing";
import { TestPermissions } from "@webiny/api-core-testing";
import { TestAuthorizer } from "@webiny/api-core-testing";
import { AuthTriggerHandler } from "@webiny/api-core-testing";
import { RootTenantInitializer } from "@webiny/api-core-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Container } from "@webiny/di";
import { processLegacyPlugins } from "./bridgeLegacyPlugins.js";
import { Extension } from "~/api/Extension.js";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    // Extra registrations for the request container, after the package's own.
    register?: (container: Container) => void;
}

interface GraphQLBody {
    query: string;
    variables?: Record<string, unknown>;
}

const identity: IdentityData = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const fullAccess: SecurityPermission[] = [{ name: "*" }];

/*
 * Registers the package's own API `Extension`, not the features under test one by one, so the tests
 * also prove the composition root wires them.
 */
export const useHandler = (params: UseHandlerParams = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");
    const permissions = params.permissions ?? fullAccess;

    let lastContainer: Container | null = null;

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, identity);
            container.registerInstance(TestPermissions, { list: permissions });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        child: async container => {
            const wcpLicense = await WcpLicenseLoader.load(createTestWcpLicense());
            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            Extension.register(container);
            params.register?.(container);

            lastContainer = container;

            GraphQLEngineFeature.register(container);
        }
    });

    const graphql = async <T = any>(body: GraphQLBody): Promise<T> => {
        const response = await handler({
            method: "POST",
            path: "/graphql",
            headers: {
                "x-tenant": "root",
                "content-type": "application/json",
                authorization: "Bearer test-token"
            },
            body
        });
        return response.body as unknown as T;
    };

    /** Runs a request and hands back its container, to resolve use cases from. */
    const container = async (): Promise<Container> => {
        await graphql({ query: "{ __typename }" });
        if (!lastContainer) {
            throw new Error("The request did not build a container.");
        }
        return lastContainer;
    };

    return { graphql, container };
};
