import { CmsContentModelHookPlugin } from "@webiny/api-headless-cms/types";

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

    public isExecuted(name: string): boolean {
        return !!this._tracked[name];
    }
}

export const hooksTracker = new HooksTracker();

export const contentModelHooks = (): CmsContentModelHookPlugin => ({
    type: "content-model-hook",
    name: "beforeContentModelCreate",
    beforeCreate: async () => {
        hooksTracker.track("contentModel:beforeCreate");
    },
    afterCreate: async () => {
        hooksTracker.track("contentModel:afterCreate");
    },
    beforeSave: async () => {
        hooksTracker.track("contentModel:beforeSave");
    },
    afterSave: async () => {
        hooksTracker.track("contentModel:afterSave");
    },
    beforeDelete: async () => {
        hooksTracker.track("contentModel:beforeDelete");
    },
    afterDelete: async () => {
        hooksTracker.track("contentModel:afterDelete");
    }
});
