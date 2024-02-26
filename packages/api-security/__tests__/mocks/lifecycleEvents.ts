import { ContextPlugin } from "@webiny/api";
import { SecurityContext } from "~/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";

export const tracker = new LifecycleEventTracker();

export const assignApiKeyLifecycleEvents = () => {
    return new ContextPlugin<SecurityContext>(async context => {
        context.security.onApiKeyBeforeCreate.subscribe(async params => {
            tracker.track("apiKey:beforeCreate", params);
        });
        context.security.onApiKeyAfterCreate.subscribe(async params => {
            tracker.track("apiKey:afterCreate", params);
        });

        context.security.onApiKeyBeforeUpdate.subscribe(async params => {
            tracker.track("apiKey:beforeUpdate", params);
        });
        context.security.onApiKeyAfterUpdate.subscribe(async params => {
            tracker.track("apiKey:afterUpdate", params);
        });

        context.security.onApiKeyBeforeDelete.subscribe(async params => {
            tracker.track("apiKey:beforeDelete", params);
        });
        context.security.onApiKeyAfterDelete.subscribe(async params => {
            tracker.track("apiKey:afterDelete", params);
        });
    });
};

export const assignGroupLifecycleEvents = () => {
    return new ContextPlugin<SecurityContext>(async context => {
        context.security.onGroupBeforeCreate.subscribe(async params => {
            tracker.track("group:beforeCreate", params);
        });
        context.security.onGroupAfterCreate.subscribe(async params => {
            tracker.track("group:afterCreate", params);
        });

        context.security.onGroupBeforeUpdate.subscribe(async params => {
            tracker.track("group:beforeUpdate", params);
        });
        context.security.onGroupAfterUpdate.subscribe(async params => {
            tracker.track("group:afterUpdate", params);
        });

        context.security.onGroupBeforeDelete.subscribe(async params => {
            tracker.track("group:beforeDelete", params);
        });
        context.security.onGroupAfterDelete.subscribe(async params => {
            tracker.track("group:afterDelete", params);
        });
    });
};
