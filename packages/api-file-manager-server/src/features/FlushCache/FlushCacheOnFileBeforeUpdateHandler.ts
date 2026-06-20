import { FileBeforeUpdateEventHandler } from "@webiny/api-file-manager/features/file/UpdateFile/events.js";

class FlushCacheOnFileBeforeUpdateHandlerImpl implements FileBeforeUpdateEventHandler.Interface {
    /* No-op: local disk does not use a CDN cache. */
    async handle(_event: FileBeforeUpdateEventHandler.Event): Promise<void> {
        // Nothing to do.
    }
}

export const FlushCacheOnFileBeforeUpdateHandler =
    FileBeforeUpdateEventHandler.createImplementation({
        implementation: FlushCacheOnFileBeforeUpdateHandlerImpl,
        dependencies: []
    });
