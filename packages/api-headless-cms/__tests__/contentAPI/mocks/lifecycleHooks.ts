import type { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import {
    ModelBeforeCreateHandler,
    ModelAfterCreateHandler
} from "~/features/contentModel/CreateModel/events.js";
import {
    ModelBeforeCreateFromHandler,
    ModelAfterCreateFromHandler
} from "~/features/contentModel/CreateModelFrom/events.js";
import {
    ModelBeforeUpdateHandler,
    ModelAfterUpdateHandler
} from "~/features/contentModel/UpdateModel/events.js";
import {
    ModelBeforeDeleteHandler,
    ModelAfterDeleteHandler
} from "~/features/contentModel/DeleteModel/events.js";
import {
    EntryBeforeCreateHandler,
    EntryAfterCreateHandler
} from "~/features/contentEntry/CreateEntry/events.js";
import {
    EntryRevisionBeforeCreateHandler,
    EntryRevisionAfterCreateHandler
} from "~/features/contentEntry/CreateEntryRevisionFrom/events.js";
import {
    EntryBeforeUpdateHandler,
    EntryAfterUpdateHandler
} from "~/features/contentEntry/UpdateEntry/events.js";
import {
    EntryBeforeDeleteHandler,
    EntryAfterDeleteHandler
} from "~/features/contentEntry/DeleteEntry/events.js";
import {
    EntryRevisionBeforeDeleteHandler,
    EntryRevisionAfterDeleteHandler
} from "~/features/contentEntry/DeleteEntryRevision/events.js";
import {
    EntryBeforePublishHandler,
    EntryAfterPublishHandler
} from "~/features/contentEntry/PublishEntry/events.js";
import {
    EntryBeforeUnpublishHandler,
    EntryAfterUnpublishHandler
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
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }

        context.container.registerFactory(ModelBeforeCreateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeCreate");
            }
        }));

        context.container.registerFactory(ModelAfterCreateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterCreate");
            }
        }));

        context.container.registerFactory(ModelBeforeCreateFromHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeCreateFrom");
            }
        }));

        context.container.registerFactory(ModelAfterCreateFromHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterCreateFrom");
            }
        }));

        context.container.registerFactory(ModelBeforeUpdateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeUpdate");
            }
        }));

        context.container.registerFactory(ModelAfterUpdateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterUpdate");
            }
        }));

        context.container.registerFactory(ModelBeforeDeleteHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeDelete");
            }
        }));

        context.container.registerFactory(ModelAfterDeleteHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterDelete");
            }
        }));
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }

        context.container.registerFactory(EntryBeforeCreateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeCreate");
            }
        }));

        context.container.registerFactory(EntryAfterCreateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterCreate");
            }
        }));

        context.container.registerFactory(EntryRevisionBeforeCreateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
            }
        }));

        context.container.registerFactory(EntryRevisionAfterCreateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
            }
        }));

        context.container.registerFactory(EntryBeforeUpdateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeUpdate");
            }
        }));

        context.container.registerFactory(EntryAfterUpdateHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterUpdate");
            }
        }));

        context.container.registerFactory(EntryBeforeDeleteHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeDelete");
            }
        }));

        context.container.registerFactory(EntryAfterDeleteHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterDelete");
            }
        }));

        context.container.registerFactory(EntryRevisionBeforeDeleteHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeDeleteRevision");
            }
        }));

        context.container.registerFactory(EntryRevisionAfterDeleteHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterDeleteRevision");
            }
        }));

        context.container.registerFactory(EntryBeforePublishHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforePublish");
            }
        }));

        context.container.registerFactory(EntryAfterPublishHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterPublish");
            }
        }));

        context.container.registerFactory(EntryBeforeUnpublishHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeUnpublish");
            }
        }));

        context.container.registerFactory(EntryAfterUnpublishHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterUnpublish");
            }
        }));
    });
};
