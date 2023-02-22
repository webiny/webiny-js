import { ContextPlugin } from "@webiny/api";
import { AcoContext } from "~/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";

export const tracker = new LifecycleEventTracker();

export const assignFolderLifecycleEvents = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.aco.folder.onFolderBeforeCreate.subscribe(async params => {
            tracker.track("folder:beforeCreate", params);
        });
        context.aco.folder.onFolderAfterCreate.subscribe(async params => {
            tracker.track("folder:afterCreate", params);
        });

        context.aco.folder.onFolderBeforeUpdate.subscribe(async params => {
            tracker.track("folder:beforeUpdate", params);
        });
        context.aco.folder.onFolderAfterUpdate.subscribe(async params => {
            tracker.track("folder:afterUpdate", params);
        });

        context.aco.folder.onFolderBeforeDelete.subscribe(async params => {
            tracker.track("folder:beforeDelete", params);
        });
        context.aco.folder.onFolderAfterDelete.subscribe(async params => {
            tracker.track("folder:afterDelete", params);
        });
    });
};

export const assignRecordLifecycleEvents = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.aco.search.onSearchRecordBeforeCreate.subscribe(async params => {
            tracker.track("searchRecord:beforeCreate", params);
        });
        context.aco.search.onSearchRecordAfterCreate.subscribe(async params => {
            tracker.track("searchRecord:afterCreate", params);
        });

        context.aco.search.onSearchRecordBeforeUpdate.subscribe(async params => {
            tracker.track("searchRecord:beforeUpdate", params);
        });
        context.aco.search.onSearchRecordAfterUpdate.subscribe(async params => {
            tracker.track("searchRecord:afterUpdate", params);
        });

        context.aco.search.onSearchRecordBeforeDelete.subscribe(async params => {
            tracker.track("searchRecord:beforeDelete", params);
        });
        context.aco.search.onSearchRecordAfterDelete.subscribe(async params => {
            tracker.track("searchRecord:afterDelete", params);
        });
    });
};
