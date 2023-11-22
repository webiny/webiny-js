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

        context.aco.search.onSearchRecordBeforeMove.subscribe(async params => {
            tracker.track("searchRecord:beforeMove", params);
        });
        context.aco.search.onSearchRecordAfterMove.subscribe(async params => {
            tracker.track("searchRecord:afterMove", params);
        });

        context.aco.search.onSearchRecordBeforeDelete.subscribe(async params => {
            tracker.track("searchRecord:beforeDelete", params);
        });
        context.aco.search.onSearchRecordAfterDelete.subscribe(async params => {
            tracker.track("searchRecord:afterDelete", params);
        });
    });
};

export const assignFilterLifecycleEvents = () => {
    return new ContextPlugin<AcoContext>(async context => {
        context.aco.filter.onFilterBeforeCreate.subscribe(async params => {
            tracker.track("filter:beforeCreate", params);
        });
        context.aco.filter.onFilterAfterCreate.subscribe(async params => {
            tracker.track("filter:afterCreate", params);
        });

        context.aco.filter.onFilterBeforeUpdate.subscribe(async params => {
            tracker.track("filter:beforeUpdate", params);
        });
        context.aco.filter.onFilterAfterUpdate.subscribe(async params => {
            tracker.track("filter:afterUpdate", params);
        });

        context.aco.filter.onFilterBeforeDelete.subscribe(async params => {
            tracker.track("filter:beforeDelete", params);
        });
        context.aco.filter.onFilterAfterDelete.subscribe(async params => {
            tracker.track("filter:afterDelete", params);
        });
    });
};
