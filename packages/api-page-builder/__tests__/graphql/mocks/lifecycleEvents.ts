import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/graphql/types";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";

export const tracker = new LifecycleEventTracker();

export const assignPageLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
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

export const assignSystemLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onSystemBeforeInstall.subscribe(async params => {
            tracker.track("system:beforeInstall", params);
        });
        context.pageBuilder.onSystemAfterInstall.subscribe(async params => {
            tracker.track("system:afterInstall", params);
        });
    });
};

export const assignSettingsLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onSettingsBeforeUpdate.subscribe(async params => {
            tracker.track("settings:beforeSettingsUpdate", params);
        });
        context.pageBuilder.onSettingsAfterUpdate.subscribe(async params => {
            tracker.track("settings:afterSettingsUpdate", params);
        });
    });
};

export const assignCategoryLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onCategoryBeforeCreate.subscribe(async params => {
            tracker.track("category:beforeCreate", params);
        });
        context.pageBuilder.onCategoryAfterCreate.subscribe(async params => {
            tracker.track("category:afterCreate", params);
        });

        context.pageBuilder.onCategoryBeforeUpdate.subscribe(async params => {
            tracker.track("category:beforeUpdate", params);
        });
        context.pageBuilder.onCategoryAfterUpdate.subscribe(async params => {
            tracker.track("category:afterUpdate", params);
        });

        context.pageBuilder.onCategoryBeforeDelete.subscribe(async params => {
            tracker.track("category:beforeDelete", params);
        });
        context.pageBuilder.onCategoryAfterDelete.subscribe(async params => {
            tracker.track("category:afterDelete", params);
        });
    });
};

export const assignMenuLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onMenuBeforeCreate.subscribe(async params => {
            tracker.track("menu:beforeCreate", params);
        });
        context.pageBuilder.onMenuAfterCreate.subscribe(async params => {
            tracker.track("menu:afterCreate", params);
        });

        context.pageBuilder.onMenuBeforeUpdate.subscribe(async params => {
            tracker.track("menu:beforeUpdate", params);
        });
        context.pageBuilder.onMenuAfterUpdate.subscribe(async params => {
            tracker.track("menu:afterUpdate", params);
        });

        context.pageBuilder.onMenuBeforeDelete.subscribe(async params => {
            tracker.track("menu:beforeDelete", params);
        });
        context.pageBuilder.onMenuAfterDelete.subscribe(async params => {
            tracker.track("menu:afterDelete", params);
        });
    });
};

export const assignPageElementLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onPageElementBeforeCreate.subscribe(async params => {
            tracker.track("pageElement:beforeCreate", params);
        });
        context.pageBuilder.onPageElementAfterCreate.subscribe(async params => {
            tracker.track("pageElement:afterCreate", params);
        });

        context.pageBuilder.onPageElementBeforeUpdate.subscribe(async params => {
            tracker.track("pageElement:beforeUpdate", params);
        });
        context.pageBuilder.onPageElementAfterUpdate.subscribe(async params => {
            tracker.track("pageElement:afterUpdate", params);
        });

        context.pageBuilder.onPageElementBeforeDelete.subscribe(async params => {
            tracker.track("pageElement:beforeDelete", params);
        });
        context.pageBuilder.onPageElementAfterDelete.subscribe(async params => {
            tracker.track("pageElement:afterDelete", params);
        });
    });
};

export const assignBlockCategoryLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onBeforeBlockCategoryCreate.subscribe(async params => {
            tracker.track("block-category:beforeCreate", params);
        });
        context.pageBuilder.onAfterBlockCategoryCreate.subscribe(async params => {
            tracker.track("block-category:afterCreate", params);
        });

        context.pageBuilder.onBeforeBlockCategoryUpdate.subscribe(async params => {
            tracker.track("block-category:beforeUpdate", params);
        });
        context.pageBuilder.onAfterBlockCategoryUpdate.subscribe(async params => {
            tracker.track("block-category:afterUpdate", params);
        });

        context.pageBuilder.onBeforeBlockCategoryDelete.subscribe(async params => {
            tracker.track("block-category:beforeDelete", params);
        });
        context.pageBuilder.onAfterBlockCategoryDelete.subscribe(async params => {
            tracker.track("block-category:afterDelete", params);
        });
    });
};

export const assignPageBlockLifecycleEvents = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onPageBlockBeforeCreate.subscribe(async params => {
            tracker.track("pageBlock:beforeCreate", params);
        });
        context.pageBuilder.onPageBlockAfterCreate.subscribe(async params => {
            tracker.track("pageBlock:afterCreate", params);
        });

        context.pageBuilder.onPageBlockBeforeUpdate.subscribe(async params => {
            tracker.track("pageBlock:beforeUpdate", params);
        });
        context.pageBuilder.onPageBlockAfterUpdate.subscribe(async params => {
            tracker.track("pageBlock:afterUpdate", params);
        });

        context.pageBuilder.onPageBlockBeforeDelete.subscribe(async params => {
            tracker.track("pageBlock:beforeDelete", params);
        });
        context.pageBuilder.onPageBlockAfterDelete.subscribe(async params => {
            tracker.track("pageBlock:afterDelete", params);
        });
    });
};
