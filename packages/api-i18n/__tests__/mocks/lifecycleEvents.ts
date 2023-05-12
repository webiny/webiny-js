import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { ContextPlugin } from "@webiny/api";
import { I18NContext } from "~/types";

export const lifecycleTracker = new LifecycleEventTracker();

export const assignLifecycleEvents = () => {
    return new ContextPlugin<I18NContext>(async context => {
        context.i18n.locales.onLocaleBeforeCreate.subscribe(async params => {
            lifecycleTracker.track("locale:beforeCreate", params);
        });
        context.i18n.locales.onLocaleAfterCreate.subscribe(async params => {
            lifecycleTracker.track("locale:afterCreate", params);
        });

        context.i18n.locales.onLocaleBeforeUpdate.subscribe(async params => {
            lifecycleTracker.track("locale:beforeUpdate", params);
        });
        context.i18n.locales.onLocaleAfterUpdate.subscribe(async params => {
            lifecycleTracker.track("locale:afterUpdate", params);
        });

        context.i18n.locales.onLocaleBeforeDelete.subscribe(async params => {
            lifecycleTracker.track("locale:beforeDelete", params);
        });
        context.i18n.locales.onLocaleAfterDelete.subscribe(async params => {
            lifecycleTracker.track("locale:afterDelete", params);
        });
    });
};
