import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import { FileManagerContext } from "~/types";

export const tracker = new LifecycleEventTracker();

export const assignFileLifecycleEvents = () => {
    return new ContextPlugin<FileManagerContext>(async context => {
        context.fileManager.onFileBeforeCreate.subscribe(async params => {
            tracker.track("file:beforeCreate", params);
        });
        context.fileManager.onFileAfterCreate.subscribe(async params => {
            tracker.track("file:afterCreate", params);
        });

        context.fileManager.onFileBeforeBatchCreate.subscribe(async params => {
            tracker.track("file:beforeBatchCreate", params);
        });
        context.fileManager.onFileAfterBatchCreate.subscribe(async params => {
            tracker.track("file:afterBatchCreate", params);
        });

        context.fileManager.onFileBeforeUpdate.subscribe(async params => {
            tracker.track("file:beforeUpdate", params);
        });
        context.fileManager.onFileAfterUpdate.subscribe(async params => {
            tracker.track("file:afterUpdate", params);
        });

        context.fileManager.onFileBeforeDelete.subscribe(async params => {
            tracker.track("file:beforeDelete", params);
        });
        context.fileManager.onFileAfterDelete.subscribe(async params => {
            tracker.track("file:afterDelete", params);
        });
    });
};

export const assignSettingsLifecycleEvents = () => {
    return new ContextPlugin<FileManagerContext>(async context => {
        context.fileManager.onSettingsBeforeUpdate.subscribe(async params => {
            tracker.track("settings:beforeUpdate", params);
        });
        context.fileManager.onSettingsAfterUpdate.subscribe(async params => {
            tracker.track("settings:afterUpdate", params);
        });
    });
};
