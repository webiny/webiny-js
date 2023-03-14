import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { PbAcoContext } from "~/types";

export const tracker = new LifecycleEventTracker();

export const assignPageLifecycleEvents = () => {
    return new ContextPlugin<PbAcoContext>(async context => {
        context.pageBuilder.onPageBeforeCreate.subscribe(async params => {
            tracker.track("page:beforeCreate", params);
        });
        context.pageBuilder.onPageAfterCreate.subscribe(async params => {
            tracker.track("page:afterCreate", params);
        });

        context.pageBuilder.onPageBeforeCreateFrom.subscribe(async params => {
            tracker.track("page:beforeCreateFrom", params);
        });
        context.pageBuilder.onPageAfterCreateFrom.subscribe(async params => {
            tracker.track("page:afterCreateFrom", params);
        });

        context.pageBuilder.onPageBeforeUpdate.subscribe(async params => {
            tracker.track("page:beforeUpdate", params);
        });
        context.pageBuilder.onPageAfterUpdate.subscribe(async params => {
            tracker.track("page:afterUpdate", params);
        });

        context.pageBuilder.onPageBeforeDelete.subscribe(async params => {
            tracker.track("page:beforeDelete", params);
        });
        context.pageBuilder.onPageAfterDelete.subscribe(async params => {
            tracker.track("page:afterDelete", params);
        });

        context.pageBuilder.onPageBeforePublish.subscribe(async params => {
            tracker.track("page:beforePublish", params);
        });
        context.pageBuilder.onPageAfterPublish.subscribe(async params => {
            tracker.track("page:afterPublish", params);
        });

        context.pageBuilder.onPageBeforeUnpublish.subscribe(async params => {
            tracker.track("page:beforeUnpublish", params);
        });
        context.pageBuilder.onPageAfterUnpublish.subscribe(async params => {
            tracker.track("page:afterUnpublish", params);
        });
    });
};
