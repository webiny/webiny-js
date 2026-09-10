import type { Container } from "@webiny/di";
import {
    createTestHttpHandler,
    registerHttpRouteInstance
} from "@webiny/event-handler-core/features/testing";
import { ApiCoreFeature, registerApiCoreStorageOperations } from "@webiny/api-core";
import { WcpLicenseLoader } from "@webiny/api-core/features/wcp/WcpLicenseLoader.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import {
    AuthTriggerHandler,
    RootTenantInitializer,
    TestAuthenticator,
    TestAuthorizer,
    TestIdentity,
    TestPermissions
} from "@webiny/api-core-testing";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { GraphQLEngineFeature } from "@webiny/api-graphql";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogAppFeature } from "~/ActivityLogAppFeature.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins";

/**
 * Runs a callback with a live `ActivityLogStorage`, against a real CMS and a real storage backend.
 *
 * The callback runs *inside* a request rather than after one, because CMS use cases depend on
 * context the CMS only establishes while handling a request — identity, tenant, access control.
 * A custom route is the shortest way to borrow the request-scoped container: registering it in the
 * `child` setup captures the container in a closure, and invoking the route runs the callback with
 * everything wired.
 */
export const useStorage = (identity?: IdentityData) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");

    const resolvedIdentity: IdentityData = identity ?? {
        id: "editor-1",
        type: "admin",
        displayName: "Ada Editor"
    };

    let body: ((container: Container) => Promise<unknown>) | null = null;
    let outcome: { value?: unknown; error?: unknown } = {};

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, resolvedIdentity);
            container.registerInstance(TestPermissions, { list: [{ name: "*" }] });
            container.register(TestAuthenticator);
            container.register(TestAuthorizer);
            container.registerDecorator(AuthTriggerHandler);
            container.registerDecorator(RootTenantInitializer);
        },
        child: async container => {
            const wcpLicense = await WcpLicenseLoader.load(createTestWcpLicense({}));

            registerApiCoreStorageOperations(container, apiCoreStorage.storageOperations);
            ApiCoreFeature.register(container, { wcpLicense });
            processLegacyPlugins(container, cmsStorage.plugins);
            HeadlessCmsFeature.register(container, { type: "manage" });

            ActivityLogAppFeature.register(container, { enabled: true });
            GraphQLEngineFeature.register(container);

            registerHttpRouteInstance(container, {
                method: "POST",
                path: "/activity-log-conformance",
                route: {
                    handle: async (_request, response) => {
                        outcome = {};
                        try {
                            outcome.value = await body!(container);
                        } catch (error) {
                            outcome.error = error;
                        }
                        return response.json({ done: true });
                    }
                }
            });
        }
    });

    return {
        identity: resolvedIdentity,
        async withStorage<T>(
            callback: (storage: ActivityLogStorage.Interface) => Promise<T>
        ): Promise<T> {
            body = async container => callback(container.resolve(ActivityLogStorage));

            const response = await handler({
                method: "POST",
                path: "/activity-log-conformance",
                headers: { "x-tenant": "root", "content-type": "application/json" },
                body: {}
            });

            if (outcome.error) {
                throw outcome.error;
            }

            if (response.statusCode && response.statusCode >= 400) {
                throw new Error(
                    `Conformance route failed with ${response.statusCode}: ` +
                        JSON.stringify(response.body)
                );
            }

            return outcome.value as T;
        }
    };
};
