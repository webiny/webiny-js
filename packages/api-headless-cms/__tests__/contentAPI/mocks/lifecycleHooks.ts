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
        context.cms.models.onBeforeCreate.subscribe(() => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.models.onAfterCreate.subscribe(() => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.models.onBeforeUpdate.subscribe(() => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.models.onAfterUpdate.subscribe(() => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.models.onBeforeDelete.subscribe(() => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.models.onAfterDelete.subscribe(() => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>((context: CmsContext) => {
        context.cms.entries.onBeforeCreate.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.entries.onAfterCreate.subscribe(() => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.entries.onBeforeCreateRevision.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.entries.onAfterCreateRevision.subscribe(() => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.entries.onBeforeUpdate.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.entries.onAfterUpdate.subscribe(() => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.entries.onBeforeDelete.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.entries.onAfterDelete.subscribe(() => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.entries.onBeforeDeleteRevision.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.entries.onAfterDeleteRevision.subscribe(() => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.entries.onBeforePublish.subscribe(() => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.entries.onAfterPublish.subscribe(() => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.entries.onBeforeUnpublish.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.entries.onAfterUnpublish.subscribe(() => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.entries.onBeforeRequestReview.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeRequestReview");
        });
        context.cms.entries.onAfterRequestReview.subscribe(() => {
            pubSubTracker.track("contentEntry:afterRequestReview");
        });
        context.cms.entries.onBeforeRequestChanges.subscribe(() => {
            pubSubTracker.track("contentEntry:beforeRequestChanges");
        });
        context.cms.entries.onAfterRequestChanges.subscribe(() => {
            pubSubTracker.track("contentEntry:afterRequestChanges");
        });
    });
};
