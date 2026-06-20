import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";

class FlushCacheOnFileDeleteHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    /* No-op: local disk does not use a CDN cache. */
    async handle(_event: FileAfterDeleteEventHandler.Event): Promise<void> {
        // Nothing to do.
    }
}

export const FlushCacheOnFileDeleteHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: FlushCacheOnFileDeleteHandlerImpl,
    dependencies: []
});
