import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/api";

class PubSubTracker {
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

export const pubSubTracker = new PubSubTracker();

export const assignModelEvents = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onBeforeModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.onAfterModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.onBeforeModelCreateFrom.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreateFrom");
        });
        context.cms.onAfterModelCreateFrom.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreateFrom");
        });
        context.cms.onBeforeModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.onAfterModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.onBeforeModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.onAfterModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onBeforeEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.onAfterEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.onBeforeEntryCreateRevision.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.onAfterEntryCreateRevision.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.onBeforeEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.onAfterEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.onBeforeEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.onAfterEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.onBeforeEntryDeleteRevision.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.onAfterEntryDeleteRevision.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.onBeforeEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.onAfterEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.onBeforeEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.onAfterEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.onBeforeEntryGet.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeGet");
        });
        context.cms.onBeforeEntryList.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeList");
        });
    });
};
