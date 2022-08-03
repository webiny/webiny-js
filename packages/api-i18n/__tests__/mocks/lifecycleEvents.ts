import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { ContextPlugin } from "@webiny/api";
import { I18NContext } from "~/types";

export const lifecycleTracker = new LifecycleEventTracker();

export const assignLifecycleEvents = () => {
    return new ContextPlugin<I18NContext>(async context => {
        context.i18n.locales.onBeforeCreate.subscribe(async params => {
            lifecycleTracker.track("locale:beforeCreate", params);
        });
        context.i18n.locales.onAfterCreate.subscribe(async params => {
            lifecycleTracker.track("locale:afterCreate", params);
        });

        context.i18n.locales.onBeforeUpdate.subscribe(async params => {
            lifecycleTracker.track("locale:beforeUpdate", params);
        });
        context.i18n.locales.onAfterUpdate.subscribe(async params => {
            lifecycleTracker.track("locale:afterUpdate", params);
        });

        context.i18n.locales.onBeforeDelete.subscribe(async params => {
            lifecycleTracker.track("locale:beforeDelete", params);
        });
        context.i18n.locales.onAfterDelete.subscribe(async params => {
            lifecycleTracker.track("locale:afterDelete", params);
        });
    });
};
