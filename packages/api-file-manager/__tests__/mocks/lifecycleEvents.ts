import type { Container } from "@webiny/di";
import { LifecycleEventTracker } from "@webiny/api/testing/lifecycleTracker.js";
import {
    FileAfterCreateEventHandler,
    FileBeforeCreateEventHandler
} from "~/features/file/CreateFile/events.js";
import {
    FileAfterBatchCreateEventHandler,
    FileBeforeBatchCreateEventHandler
} from "~/features/file/CreateFilesInBatch/events.js";
import {
    FileAfterUpdateEventHandler,
    FileBeforeUpdateEventHandler
} from "~/features/file/UpdateFile/events.js";
import {
    FileAfterDeleteEventHandler,
    FileBeforeDeleteEventHandler
} from "~/features/file/DeleteFile/events.js";

export const tracker = new LifecycleEventTracker();

export const assignFileLifecycleEvents = () => {
    return (container: Container) => {
        container.registerInstance(FileBeforeCreateEventHandler, {
            handle: event => {
                tracker.track("file:beforeCreate", event.payload);
            }
        });

        container.registerInstance(FileAfterCreateEventHandler, {
            handle: event => {
                tracker.track("file:afterCreate", event.payload);
            }
        });

        container.registerInstance(FileBeforeBatchCreateEventHandler, {
            handle: event => {
                tracker.track("file:beforeBatchCreate", event.payload);
            }
        });

        container.registerInstance(FileAfterBatchCreateEventHandler, {
            handle: event => {
                tracker.track("file:afterBatchCreate", event.payload);
            }
        });

        container.registerInstance(FileBeforeUpdateEventHandler, {
            handle: event => {
                tracker.track("file:beforeUpdate", event.payload);
            }
        });

        container.registerInstance(FileAfterUpdateEventHandler, {
            handle: event => {
                tracker.track("file:afterUpdate", event.payload);
            }
        });

        container.registerInstance(FileBeforeDeleteEventHandler, {
            handle: event => {
                tracker.track("file:beforeDelete", event.payload);
            }
        });

        container.registerInstance(FileAfterDeleteEventHandler, {
            handle: event => {
                tracker.track("file:afterDelete", event.payload);
            }
        });
    };
};
