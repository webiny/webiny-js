import type { Container } from "@webiny/di";
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
    return async (container: Container) => {
        container.registerFactory(ModelBeforeCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeCreate");
            }
        }));

        container.registerFactory(ModelAfterCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterCreate");
            }
        }));

        container.registerFactory(ModelBeforeCreateFromEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeCreateFrom");
            }
        }));

        container.registerFactory(ModelAfterCreateFromEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterCreateFrom");
            }
        }));

        container.registerFactory(ModelBeforeUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeUpdate");
            }
        }));

        container.registerFactory(ModelAfterUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterUpdate");
            }
        }));

        container.registerFactory(ModelBeforeDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:beforeDelete");
            }
        }));

        container.registerFactory(ModelAfterDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentModel:afterDelete");
            }
        }));
    };
};

export const assignEntryEvents = () => {
    return async (container: Container) => {
        container.registerFactory(EntryBeforeCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeCreate");
            }
        }));

        container.registerFactory(EntryAfterCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterCreate");
            }
        }));

        container.registerFactory(EntryRevisionBeforeCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
            }
        }));

        container.registerFactory(EntryRevisionAfterCreateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
            }
        }));

        container.registerFactory(EntryBeforeUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeUpdate");
            }
        }));

        container.registerFactory(EntryAfterUpdateEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterUpdate");
            }
        }));

        container.registerFactory(EntryBeforeDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeDelete");
            }
        }));

        container.registerFactory(EntryAfterDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterDelete");
            }
        }));

        container.registerFactory(EntryRevisionBeforeDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeDeleteRevision");
            }
        }));

        container.registerFactory(EntryRevisionAfterDeleteEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterDeleteRevision");
            }
        }));

        container.registerFactory(EntryBeforePublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforePublish");
            }
        }));

        container.registerFactory(EntryAfterPublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterPublish");
            }
        }));

        container.registerFactory(EntryBeforeUnpublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:beforeUnpublish");
            }
        }));

        container.registerFactory(EntryAfterUnpublishEventHandler, () => ({
            async handle() {
                pubSubTracker.track("contentEntry:afterUnpublish");
            }
        }));
    };
};
