import { ContextPlugin } from "@webiny/api";
import { LifecycleEventTracker } from "@webiny/project-utils/testing/helpers/lifecycleTracker";
import {
    FileAfterCreateHandler,
    FileBeforeCreateHandler
} from "~/features/file/CreateFile/events.js";
import {
    FileAfterBatchCreateHandler,
    FileBeforeBatchCreateHandler
} from "~/features/file/CreateFilesInBatch/events.js";
import {
    FileAfterUpdateHandler,
    FileBeforeUpdateHandler
} from "~/features/file/UpdateFile/events.js";
import {
    FileAfterDeleteHandler,
    FileBeforeDeleteHandler
} from "~/features/file/DeleteFile/events.js";

export const tracker = new LifecycleEventTracker();

export const assignFileLifecycleEvents = () => {
    return new ContextPlugin(async context => {
        context.container.registerInstance(FileBeforeCreateHandler, {
            handle: event => {
                tracker.track("file:beforeCreate", event.payload);
            }
        });

        context.container.registerInstance(FileAfterCreateHandler, {
            handle: event => {
                tracker.track("file:afterCreate", event.payload);
            }
        });

        context.container.registerInstance(FileBeforeBatchCreateHandler, {
            handle: event => {
                tracker.track("file:beforeBatchCreate", event.payload);
            }
        });

        context.container.registerInstance(FileAfterBatchCreateHandler, {
            handle: event => {
                tracker.track("file:afterBatchCreate", event.payload);
            }
        });

        context.container.registerInstance(FileBeforeUpdateHandler, {
            handle: event => {
                tracker.track("file:beforeUpdate", event.payload);
            }
        });

        context.container.registerInstance(FileAfterUpdateHandler, {
            handle: event => {
                tracker.track("file:afterUpdate", event.payload);
            }
        });

        context.container.registerInstance(FileBeforeDeleteHandler, {
            handle: event => {
                tracker.track("file:beforeDelete", event.payload);
            }
        });

        context.container.registerInstance(FileAfterDeleteHandler, {
            handle: event => {
                tracker.track("file:afterDelete", event.payload);
            }
        });
    });
};
