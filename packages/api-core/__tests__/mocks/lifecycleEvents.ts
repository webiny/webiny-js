import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    ApiKeyBeforeCreateHandler,
    ApiKeyAfterCreateHandler
} from "~/features/security/apiKeys/CreateApiKey/events.js";
import {
    ApiKeyBeforeUpdateHandler,
    ApiKeyAfterUpdateHandler
} from "~/features/security/apiKeys/UpdateApiKey/events.js";
import {
    ApiKeyBeforeDeleteHandler,
    ApiKeyAfterDeleteHandler
} from "~/features/security/apiKeys/DeleteApiKey/events.js";
import {
    RoleBeforeCreateHandler,
    RoleAfterCreateHandler
} from "~/features/security/roles/CreateRole/events.js";
import {
    RoleBeforeUpdateHandler,
    RoleAfterUpdateHandler
} from "~/features/security/roles/UpdateRole/events.js";
import {
    RoleBeforeDeleteHandler,
    RoleAfterDeleteHandler
} from "~/features/security/roles/DeleteRole/events.js";
import type { ApiCoreContext } from "~/types/core.js";

export const tracker = new LifecycleEventTracker();

export const assignApiKeyLifecycleEvents = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        if (!context.container) {
            return;
        }

        // Register before create handler
        context.container.registerFactory(ApiKeyBeforeCreateHandler, () => ({
            handle: async (event: ApiKeyBeforeCreateHandler.Event) => {
                tracker.track("apiKey:beforeCreate", event);
            }
        }));

        // Register after create handler
        context.container.registerFactory(ApiKeyAfterCreateHandler, () => ({
            handle: async (event: ApiKeyAfterCreateHandler.Event) => {
                tracker.track("apiKey:afterCreate", event);
            }
        }));

        // Register before update handler
        context.container.registerFactory(ApiKeyBeforeUpdateHandler, () => ({
            handle: async (event: ApiKeyBeforeUpdateHandler.Event) => {
                tracker.track("apiKey:beforeUpdate", event);
            }
        }));

        // Register after update handler
        context.container.registerFactory(ApiKeyAfterUpdateHandler, () => ({
            handle: async (event: ApiKeyAfterUpdateHandler.Event) => {
                tracker.track("apiKey:afterUpdate", event);
            }
        }));

        // Register before delete handler
        context.container.registerFactory(ApiKeyBeforeDeleteHandler, () => ({
            handle: async (event: ApiKeyBeforeDeleteHandler.Event) => {
                tracker.track("apiKey:beforeDelete", event);
            }
        }));

        // Register after delete handler
        context.container.registerFactory(ApiKeyAfterDeleteHandler, () => ({
            handle: async (event: ApiKeyAfterDeleteHandler.Event) => {
                tracker.track("apiKey:afterDelete", event);
            }
        }));
    });
};

export const assignRoleLifecycleEvents = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        if (!context.container) {
            return;
        }

        // Register before create handler
        context.container.registerFactory(RoleBeforeCreateHandler, () => ({
            handle: async (event: RoleBeforeCreateHandler.Event) => {
                tracker.track("role:beforeCreate", event);
            }
        }));

        // Register after create handler
        context.container.registerFactory(RoleAfterCreateHandler, () => ({
            handle: async (event: RoleAfterCreateHandler.Event) => {
                tracker.track("role:afterCreate", event);
            }
        }));

        // Register before update handler
        context.container.registerFactory(RoleBeforeUpdateHandler, () => ({
            handle: async (event: RoleBeforeUpdateHandler.Event) => {
                tracker.track("role:beforeUpdate", event);
            }
        }));

        // Register after update handler
        context.container.registerFactory(RoleAfterUpdateHandler, () => ({
            handle: async (event: RoleAfterUpdateHandler.Event) => {
                tracker.track("role:afterUpdate", event);
            }
        }));

        // Register before delete handler
        context.container.registerFactory(RoleBeforeDeleteHandler, () => ({
            handle: async (event: RoleBeforeDeleteHandler.Event) => {
                tracker.track("role:beforeDelete", event);
            }
        }));

        // Register after delete handler
        context.container.registerFactory(RoleAfterDeleteHandler, () => ({
            handle: async (event: RoleAfterDeleteHandler.Event) => {
                tracker.track("role:afterDelete", event);
            }
        }));
    });
};
