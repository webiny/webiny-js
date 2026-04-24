import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
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
    return new ContextPlugin(async context => {
        context.container.registerInstance(FileBeforeCreateEventHandler, {
            handle: event => {
                tracker.track("file:beforeCreate", event.payload);
            }
        });

        context.container.registerInstance(FileAfterCreateEventHandler, {
            handle: event => {
                tracker.track("file:afterCreate", event.payload);
            }
        });

        context.container.registerInstance(FileBeforeBatchCreateEventHandler, {
            handle: event => {
                tracker.track("file:beforeBatchCreate", event.payload);
            }
        });

        context.container.registerInstance(FileAfterBatchCreateEventHandler, {
            handle: event => {
                tracker.track("file:afterBatchCreate", event.payload);
            }
        });

        context.container.registerInstance(FileBeforeUpdateEventHandler, {
            handle: event => {
                tracker.track("file:beforeUpdate", event.payload);
            }
        });

        context.container.registerInstance(FileAfterUpdateEventHandler, {
            handle: event => {
                tracker.track("file:afterUpdate", event.payload);
            }
        });

        context.container.registerInstance(FileBeforeDeleteEventHandler, {
            handle: event => {
                tracker.track("file:beforeDelete", event.payload);
            }
        });

        context.container.registerInstance(FileAfterDeleteEventHandler, {
            handle: event => {
                tracker.track("file:afterDelete", event.payload);
            }
        });
    });
};
