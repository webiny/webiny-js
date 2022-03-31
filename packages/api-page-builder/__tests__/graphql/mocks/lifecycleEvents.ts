import { ContextPlugin } from "@webiny/handler";
import { PbContext } from "~/graphql/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";

export const tracker = new LifecycleEventTracker();

export const assignPageLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforePageCreate.subscribe(async params => {
            tracker.track("page:beforeCreate", params);
        });
        context.pageBuilder.onAfterPageCreate.subscribe(async params => {
            tracker.track("page:afterCreate", params);
        });

        context.pageBuilder.onBeforePageCreateFrom.subscribe(async params => {
            tracker.track("page:beforeCreateFrom", params);
        });
        context.pageBuilder.onAfterPageCreateFrom.subscribe(async params => {
            tracker.track("page:afterCreateFrom", params);
        });

        context.pageBuilder.onBeforePageUpdate.subscribe(async params => {
            tracker.track("page:beforeUpdate", params);
        });
        context.pageBuilder.onAfterPageUpdate.subscribe(async params => {
            tracker.track("page:afterUpdate", params);
        });

        context.pageBuilder.onBeforePageDelete.subscribe(async params => {
            tracker.track("page:beforeDelete", params);
        });
        context.pageBuilder.onAfterPageDelete.subscribe(async params => {
            tracker.track("page:afterDelete", params);
        });

        context.pageBuilder.onBeforePagePublish.subscribe(async params => {
            tracker.track("page:beforePublish", params);
        });
        context.pageBuilder.onAfterPagePublish.subscribe(async params => {
            tracker.track("page:afterPublish", params);
        });

        context.pageBuilder.onBeforePageUnpublish.subscribe(async params => {
            tracker.track("page:beforeUnpublish", params);
        });
        context.pageBuilder.onAfterPageUnpublish.subscribe(async params => {
            tracker.track("page:afterUnpublish", params);
        });

        context.pageBuilder.onBeforePageRequestReview.subscribe(async params => {
            tracker.track("page:beforeRequestReview", params);
        });
        context.pageBuilder.onAfterPageRequestReview.subscribe(async params => {
            tracker.track("page:afterRequestReview", params);
        });

        context.pageBuilder.onBeforePageRequestChanges.subscribe(async params => {
            tracker.track("page:beforeRequestChanges", params);
        });
        context.pageBuilder.onAfterPageRequestChanges.subscribe(async params => {
            tracker.track("page:afterRequestChanges", params);
        });
    });
};
