import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { LocalePlugin } from "~/plugins/LocalePlugin";

export const lifecycleTracker = new LifecycleEventTracker();

export const localeLifecyclePlugin = new LocalePlugin({
    beforeCreate: async params => {
        lifecycleTracker.track("locale:beforeCreate", params);
    },
    afterCreate: async params => {
        lifecycleTracker.track("locale:afterCreate", params);
    },
    beforeUpdate: async params => {
        lifecycleTracker.track("locale:beforeUpdate", params);
    },
    afterUpdate: async params => {
        lifecycleTracker.track("locale:afterUpdate", params);
    },
    beforeDelete: async params => {
        lifecycleTracker.track("locale:beforeDelete", params);
    },
    afterDelete: async params => {
        lifecycleTracker.track("locale:afterDelete", params);
    }
});
