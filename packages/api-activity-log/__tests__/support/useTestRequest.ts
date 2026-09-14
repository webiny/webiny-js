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
import { ActivityLogAppFeature } from "~/ActivityLogAppFeature.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins.js";

const ROUTE_PATH = "/activity-log-test";

export interface IUseTestRequestOptions {
    identity?: IdentityData;
    permissions?: { name: string }[];
    /**
     * Extra registrations in the per-request child container, applied after the CMS is registered
     * and before the activity log is. Where a test's own models go.
     */
    setup?: (container: Container) => void;
}

/**
 * A live request against a real CMS and a real storage backend, with the request container exposed.
 *
 * Both the storage conformance suite and the capture integration tests need the same thing — an
 * activity log wired into a running CMS — so the harness exists once. Two copies of it drifted
 * within a day of each other, and the parts that matter here are subtle enough that a divergence
 * would be invisible: which features are registered, in what order, and under which identity.
 *
 * The callback runs *inside* a request rather than after one, because CMS use cases depend on
 * context the CMS only establishes while handling a request — identity, tenant, access control.
 * A custom route is the shortest way to borrow the request-scoped container: registering it in the
 * `child` setup captures the container in a closure, and invoking the route runs the callback with
 * everything wired.
 *
 * Each call to `withContainer` is a separate request and therefore a separate child container, so
 * anything a test does to a request-scoped instance dies with that request. The storage backend
 * behind it is shared, so written entries and records persist across calls within a file.
 */
export const useTestRequest = (options: IUseTestRequestOptions = {}) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps("cms");

    const identity: IdentityData = options.identity ?? {
        id: "editor-1",
        type: "admin",
        displayName: "Ada Editor"
    };

    let body: ((container: Container) => Promise<unknown>) | null = null;
    let outcome: { value?: unknown; error?: unknown } = {};

    const handler = createTestHttpHandler({
        root: container => {
            container.registerInstance(TestIdentity, identity);
            container.registerInstance(TestPermissions, {
                list: options.permissions ?? [{ name: "*" }]
            });
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

            options.setup?.(container);

            ActivityLogAppFeature.register(container, { enabled: true });
            GraphQLEngineFeature.register(container);

            registerHttpRouteInstance(container, {
                method: "POST",
                path: ROUTE_PATH,
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
        identity,
        /** Runs the callback inside a request, with the live request container. */
        async withContainer<T>(callback: (container: Container) => Promise<T>): Promise<T> {
            body = container => callback(container) as Promise<unknown>;

            const response = await handler({
                method: "POST",
                path: ROUTE_PATH,
                headers: { "x-tenant": "root", "content-type": "application/json" },
                body: {}
            });

            if (outcome.error) {
                throw outcome.error;
            }

            if (response.statusCode && response.statusCode >= 400) {
                throw new Error(
                    `Test route failed with ${response.statusCode}: ` +
                        JSON.stringify(response.body)
                );
            }

            return outcome.value as T;
        }
    };
};
