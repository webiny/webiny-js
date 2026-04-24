import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    ApiKeyBeforeCreateEventHandler,
    ApiKeyAfterCreateEventHandler
} from "~/features/security/apiKeys/CreateApiKey/events.js";
import {
    ApiKeyBeforeUpdateEventHandler,
    ApiKeyAfterUpdateEventHandler
} from "~/features/security/apiKeys/UpdateApiKey/events.js";
import {
    ApiKeyBeforeDeleteEventHandler,
    ApiKeyAfterDeleteEventHandler
} from "~/features/security/apiKeys/DeleteApiKey/events.js";
import {
    RoleBeforeCreateEventHandler,
    RoleAfterCreateEventHandler
} from "~/features/security/roles/CreateRole/events.js";
import {
    RoleBeforeUpdateEventHandler,
    RoleAfterUpdateEventHandler
} from "~/features/security/roles/UpdateRole/events.js";
import {
    RoleBeforeDeleteEventHandler,
    RoleAfterDeleteEventHandler
} from "~/features/security/roles/DeleteRole/events.js";
import type { ApiCoreContext } from "~/types/core.js";

export const tracker = new LifecycleEventTracker();

export const assignApiKeyLifecycleEvents = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        if (!context.container) {
            return;
        }

        // Register before create handler
        context.container.registerFactory(ApiKeyBeforeCreateEventHandler, () => ({
            handle: async (event: ApiKeyBeforeCreateEventHandler.Event) => {
                tracker.track("apiKey:beforeCreate", event);
            }
        }));

        // Register after create handler
        context.container.registerFactory(ApiKeyAfterCreateEventHandler, () => ({
            handle: async (event: ApiKeyAfterCreateEventHandler.Event) => {
                tracker.track("apiKey:afterCreate", event);
            }
        }));

        // Register before update handler
        context.container.registerFactory(ApiKeyBeforeUpdateEventHandler, () => ({
            handle: async (event: ApiKeyBeforeUpdateEventHandler.Event) => {
                tracker.track("apiKey:beforeUpdate", event);
            }
        }));

        // Register after update handler
        context.container.registerFactory(ApiKeyAfterUpdateEventHandler, () => ({
            handle: async (event: ApiKeyAfterUpdateEventHandler.Event) => {
                tracker.track("apiKey:afterUpdate", event);
            }
        }));

        // Register before delete handler
        context.container.registerFactory(ApiKeyBeforeDeleteEventHandler, () => ({
            handle: async (event: ApiKeyBeforeDeleteEventHandler.Event) => {
                tracker.track("apiKey:beforeDelete", event);
            }
        }));

        // Register after delete handler
        context.container.registerFactory(ApiKeyAfterDeleteEventHandler, () => ({
            handle: async (event: ApiKeyAfterDeleteEventHandler.Event) => {
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
        context.container.registerFactory(RoleBeforeCreateEventHandler, () => ({
            handle: async (event: RoleBeforeCreateEventHandler.Event) => {
                tracker.track("role:beforeCreate", event);
            }
        }));

        // Register after create handler
        context.container.registerFactory(RoleAfterCreateEventHandler, () => ({
            handle: async (event: RoleAfterCreateEventHandler.Event) => {
                tracker.track("role:afterCreate", event);
            }
        }));

        // Register before update handler
        context.container.registerFactory(RoleBeforeUpdateEventHandler, () => ({
            handle: async (event: RoleBeforeUpdateEventHandler.Event) => {
                tracker.track("role:beforeUpdate", event);
            }
        }));

        // Register after update handler
        context.container.registerFactory(RoleAfterUpdateEventHandler, () => ({
            handle: async (event: RoleAfterUpdateEventHandler.Event) => {
                tracker.track("role:afterUpdate", event);
            }
        }));

        // Register before delete handler
        context.container.registerFactory(RoleBeforeDeleteEventHandler, () => ({
            handle: async (event: RoleBeforeDeleteEventHandler.Event) => {
                tracker.track("role:beforeDelete", event);
            }
        }));

        // Register after delete handler
        context.container.registerFactory(RoleAfterDeleteEventHandler, () => ({
            handle: async (event: RoleAfterDeleteEventHandler.Event) => {
                tracker.track("role:afterDelete", event);
            }
        }));
    });
};
