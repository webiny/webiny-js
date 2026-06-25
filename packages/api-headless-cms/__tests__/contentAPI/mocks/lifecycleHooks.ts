import type { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import {
    ModelBeforeCreateEventHandler,
    ModelAfterCreateEventHandler
} from "~/features/contentModel/CreateModel/events.js";
import {
    ModelBeforeCreateFromEventHandler,
    ModelAfterCreateFromEventHandler
} from "~/features/contentModel/CreateModelFrom/events.js";
import {
    ModelBeforeUpdateEventHandler,
    ModelAfterUpdateEventHandler
} from "~/features/contentModel/UpdateModel/events.js";
import {
    ModelBeforeDeleteEventHandler,
    ModelAfterDeleteEventHandler
} from "~/features/contentModel/DeleteModel/events.js";
import {
    EntryBeforeCreateEventHandler,
    EntryAfterCreateEventHandler
} from "~/features/contentEntry/CreateEntry/events.js";
import {
    EntryRevisionBeforeCreateEventHandler,
    EntryRevisionAfterCreateEventHandler
} from "~/features/contentEntry/CreateEntryRevisionFrom/events.js";
import {
    EntryBeforeUpdateEventHandler,
    EntryAfterUpdateEventHandler
} from "~/features/contentEntry/UpdateEntry/events.js";
import {
    EntryBeforeDeleteEventHandler,
    EntryAfterDeleteEventHandler
} from "~/features/contentEntry/DeleteEntry/events.js";
import {
    EntryRevisionBeforeDeleteEventHandler,
    EntryRevisionAfterDeleteEventHandler
} from "~/features/contentEntry/DeleteEntryRevision/events.js";
import {
    EntryBeforePublishEventHandler,
    EntryAfterPublishEventHandler
} from "~/features/contentEntry/PublishEntry/events.js";
import {
    EntryBeforeUnpublishEventHandler,
    EntryAfterUnpublishEventHandler
} from "~/features/contentEntry/UnpublishEntry/events.js";

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
        context.container.registerFactory(ModelBeforeCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeCreate");
            }
        }));

        context.container.registerFactory(ModelAfterCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterCreate");
            }
        }));

        context.container.registerFactory(ModelBeforeCreateFromEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeCreateFrom");
            }
        }));

        context.container.registerFactory(ModelAfterCreateFromEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterCreateFrom");
            }
        }));

        context.container.registerFactory(ModelBeforeUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeUpdate");
            }
        }));

        context.container.registerFactory(ModelAfterUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterUpdate");
            }
        }));

        context.container.registerFactory(ModelBeforeDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeDelete");
            }
        }));

        context.container.registerFactory(ModelAfterDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterDelete");
            }
        }));
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        context.container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeCreate");
            }
        }));

        context.container.registerFactory(EntryAfterCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterCreate");
            }
        }));

        context.container.registerFactory(EntryRevisionBeforeCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
            }
        }));

        context.container.registerFactory(EntryRevisionAfterCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
            }
        }));

        context.container.registerFactory(EntryBeforeUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeUpdate");
            }
        }));

        context.container.registerFactory(EntryAfterUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterUpdate");
            }
        }));

        context.container.registerFactory(EntryBeforeDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeDelete");
            }
        }));

        context.container.registerFactory(EntryAfterDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterDelete");
            }
        }));

        context.container.registerFactory(EntryRevisionBeforeDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeDeleteRevision");
            }
        }));

        context.container.registerFactory(EntryRevisionAfterDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterDeleteRevision");
            }
        }));

        context.container.registerFactory(EntryBeforePublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforePublish");
            }
        }));

        context.container.registerFactory(EntryAfterPublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterPublish");
            }
        }));

        context.container.registerFactory(EntryBeforeUnpublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeUnpublish");
            }
        }));

        context.container.registerFactory(EntryAfterUnpublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterUnpublish");
            }
        }));
    });
};
