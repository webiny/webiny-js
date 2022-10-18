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
        context.cms.onModelBeforeCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.onModelAfterCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.onModelBeforeCreateFrom.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreateFrom");
        });
        context.cms.onModelAfterCreateFrom.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreateFrom");
        });
        context.cms.onModelBeforeUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.onModelAfterUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.onModelBeforeDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.onModelAfterDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onEntryBeforeCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.onEntryAfterCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.onEntryRevisionBeforeCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.onEntryRevisionAfterCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.onEntryBeforeUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.onEntryAfterUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.onEntryBeforeDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.onEntryAfterDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.onEntryRevisionBeforeDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.onEntryRevisionAfterDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.onEntryBeforePublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.onEntryAfterPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.onEntryBeforeUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.onEntryAfterUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.onEntryBeforeGet.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeGet");
        });
        context.cms.onEntryBeforeList.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeList");
        });
    });
};
