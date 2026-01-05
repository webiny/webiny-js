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
    GroupBeforeCreateHandler,
    GroupAfterCreateHandler
} from "~/features/security/roles/CreateGroup/events.js";
import {
    GroupBeforeUpdateHandler,
    GroupAfterUpdateHandler
} from "~/features/security/roles/UpdateGroup/events.js";
import {
    GroupBeforeDeleteHandler,
    GroupAfterDeleteHandler
} from "~/features/security/roles/DeleteGroup/events.js";
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

export const assignGroupLifecycleEvents = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        if (!context.container) {
            return;
        }

        // Register before create handler
        context.container.registerFactory(GroupBeforeCreateHandler, () => ({
            handle: async (event: GroupBeforeCreateHandler.Event) => {
                tracker.track("group:beforeCreate", event);
            }
        }));

        // Register after create handler
        context.container.registerFactory(GroupAfterCreateHandler, () => ({
            handle: async (event: GroupAfterCreateHandler.Event) => {
                tracker.track("group:afterCreate", event);
            }
        }));

        // Register before update handler
        context.container.registerFactory(GroupBeforeUpdateHandler, () => ({
            handle: async (event: GroupBeforeUpdateHandler.Event) => {
                tracker.track("group:beforeUpdate", event);
            }
        }));

        // Register after update handler
        context.container.registerFactory(GroupAfterUpdateHandler, () => ({
            handle: async (event: GroupAfterUpdateHandler.Event) => {
                tracker.track("group:afterUpdate", event);
            }
        }));

        // Register before delete handler
        context.container.registerFactory(GroupBeforeDeleteHandler, () => ({
            handle: async (event: GroupBeforeDeleteHandler.Event) => {
                tracker.track("group:beforeDelete", event);
            }
        }));

        // Register after delete handler
        context.container.registerFactory(GroupAfterDeleteHandler, () => ({
            handle: async (event: GroupAfterDeleteHandler.Event) => {
                tracker.track("group:afterDelete", event);
            }
        }));
    });
};
