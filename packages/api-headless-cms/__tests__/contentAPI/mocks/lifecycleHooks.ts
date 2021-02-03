import {
    CmsContentEntryHookPlugin,
    CmsContentModelHookPlugin
} from "@webiny/api-headless-cms/types";

class HooksTracker {
    private _tracked: Record<string, number> = {};

    public track(name: string): void {
        if (!this._tracked[name]) {
            this._tracked[name] = 0;
        }
        this._tracked[name]++;
    }

    public reset(): void {
        this._tracked = {};
    }

    public isExecutedOnce(name: string): boolean {
        return this._tracked[name] === 1;
    }

    public getExecuted(name: string): number {
        return this._tracked[name] || 0;
    }
}

export const hooksTracker = new HooksTracker();

export const contentModelHooks = (): CmsContentModelHookPlugin => ({
    type: "content-model-hook",
    name: "contentModelDummyHooks",
    beforeCreate: async () => {
        hooksTracker.track("contentModel:beforeCreate");
    },
    afterCreate: async () => {
        hooksTracker.track("contentModel:afterCreate");
    },
    beforeUpdate: async () => {
        hooksTracker.track("contentModel:beforeUpdate");
    },
    afterUpdate: async () => {
        hooksTracker.track("contentModel:afterUpdate");
    },
    beforeDelete: async () => {
        hooksTracker.track("contentModel:beforeDelete");
    },
    afterDelete: async () => {
        hooksTracker.track("contentModel:afterDelete");
    }
});

export const contentEntryHooks = (): CmsContentEntryHookPlugin => ({
    type: "content-entry-hook",
    name: "contentEntryDummyHooks",
    beforeCreate: async () => {
        hooksTracker.track("contentEntry:beforeCreate");
    },
    afterCreate: async () => {
        hooksTracker.track("contentEntry:afterCreate");
    },
    beforeCreateRevisionFrom: async () => {
        hooksTracker.track("contentEntry:beforeCreateRevisionFrom");
    },
    afterCreateRevisionFrom: async () => {
        hooksTracker.track("contentEntry:afterCreateRevisionFrom");
    },
    beforeUpdate: async () => {
        hooksTracker.track("contentEntry:beforeUpdate");
    },
    afterUpdate: async () => {
        hooksTracker.track("contentEntry:afterUpdate");
    },
    beforeDeleteRevision: async () => {
        hooksTracker.track("contentEntry:beforeDeleteRevision");
    },
    afterDeleteRevision: async () => {
        hooksTracker.track("contentEntry:afterDeleteRevision");
    },
    beforeDelete: async () => {
        hooksTracker.track("contentEntry:beforeDelete");
    },
    afterDelete: async () => {
        hooksTracker.track("contentEntry:afterDelete");
    },
    beforePublish: async () => {
        hooksTracker.track("contentEntry:beforePublish");
    },
    afterPublish: async () => {
        hooksTracker.track("contentEntry:afterPublish");
    },
    beforeUnpublish: async () => {
        hooksTracker.track("contentEntry:beforeUnpublish");
    },
    afterUnpublish: async () => {
        hooksTracker.track("contentEntry:afterUnpublish");
    },
    beforeRequestChanges: async () => {
        hooksTracker.track("contentEntry:beforeRequestChanges");
    },
    afterRequestChanges: async () => {
        hooksTracker.track("contentEntry:afterRequestChanges");
    },
    beforeRequestReview: async () => {
        hooksTracker.track("contentEntry:beforeRequestReview");
    },
    afterRequestReview: async () => {
        hooksTracker.track("contentEntry:afterRequestReview");
    }
});
