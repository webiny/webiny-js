import { ContextPlugin } from "@webiny/api";
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
    });
};

export const assignSystemLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforeInstall.subscribe(async params => {
            tracker.track("system:beforeInstall", params);
        });
        context.pageBuilder.onAfterInstall.subscribe(async params => {
            tracker.track("system:afterInstall", params);
        });
    });
};

export const assignSettingsLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforeSettingsUpdate.subscribe(async params => {
            tracker.track("settings:beforeSettingsUpdate", params);
        });
        context.pageBuilder.onAfterSettingsUpdate.subscribe(async params => {
            tracker.track("settings:afterSettingsUpdate", params);
        });
    });
};

export const assignCategoryLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforeCategoryCreate.subscribe(async params => {
            tracker.track("category:beforeCreate", params);
        });
        context.pageBuilder.onAfterCategoryCreate.subscribe(async params => {
            tracker.track("category:afterCreate", params);
        });

        context.pageBuilder.onBeforeCategoryUpdate.subscribe(async params => {
            tracker.track("category:beforeUpdate", params);
        });
        context.pageBuilder.onAfterCategoryUpdate.subscribe(async params => {
            tracker.track("category:afterUpdate", params);
        });

        context.pageBuilder.onBeforeCategoryDelete.subscribe(async params => {
            tracker.track("category:beforeDelete", params);
        });
        context.pageBuilder.onAfterCategoryDelete.subscribe(async params => {
            tracker.track("category:afterDelete", params);
        });
    });
};

export const assignMenuLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforeMenuCreate.subscribe(async params => {
            tracker.track("menu:beforeCreate", params);
        });
        context.pageBuilder.onAfterMenuCreate.subscribe(async params => {
            tracker.track("menu:afterCreate", params);
        });

        context.pageBuilder.onBeforeMenuUpdate.subscribe(async params => {
            tracker.track("menu:beforeUpdate", params);
        });
        context.pageBuilder.onAfterMenuUpdate.subscribe(async params => {
            tracker.track("menu:afterUpdate", params);
        });

        context.pageBuilder.onBeforeMenuDelete.subscribe(async params => {
            tracker.track("menu:beforeDelete", params);
        });
        context.pageBuilder.onAfterMenuDelete.subscribe(async params => {
            tracker.track("menu:afterDelete", params);
        });
    });
};

export const assignPageElementLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforePageElementCreate.subscribe(async params => {
            tracker.track("pageElement:beforeCreate", params);
        });
        context.pageBuilder.onAfterPageElementCreate.subscribe(async params => {
            tracker.track("pageElement:afterCreate", params);
        });

        context.pageBuilder.onBeforePageElementUpdate.subscribe(async params => {
            tracker.track("pageElement:beforeUpdate", params);
        });
        context.pageBuilder.onAfterPageElementUpdate.subscribe(async params => {
            tracker.track("pageElement:afterUpdate", params);
        });

        context.pageBuilder.onBeforePageElementDelete.subscribe(async params => {
            tracker.track("pageElement:beforeDelete", params);
        });
        context.pageBuilder.onAfterPageElementDelete.subscribe(async params => {
            tracker.track("pageElement:afterDelete", params);
        });
    });
};
