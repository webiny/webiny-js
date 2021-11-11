import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

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
        context.cms.models.onBeforeModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.models.onAfterModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.models.onBeforeModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.models.onAfterModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.models.onBeforeModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.models.onAfterModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.entries.onBeforeEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.entries.onAfterEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.entries.onBeforeEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.entries.onAfterEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.entries.onBeforeEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.entries.onAfterEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.entries.onBeforeEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.entries.onAfterEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.entries.onBeforeEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.entries.onAfterEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.entries.onBeforeEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.entries.onAfterEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.entries.onBeforeEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.entries.onAfterEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.entries.onBeforeEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestReview");
        });
        context.cms.entries.onAfterEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestReview");
        });
        context.cms.entries.onBeforeEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestChanges");
        });
        context.cms.entries.onAfterEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestChanges");
        });
    });
};
