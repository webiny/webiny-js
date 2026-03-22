import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { File, FileInput } from "~/domain/file/types.js";

// ============================================================================
// FileBeforeBatchCreate Event
// ============================================================================

export interface FileBeforeBatchCreatePayload {
    files: FileInput[];
    meta?: Record<string, any>;
}

export class FileBeforeBatchCreateEvent extends DomainEvent<FileBeforeBatchCreatePayload> {
    eventType = "FileManager/File/BeforeBatchCreate" as const;

    getHandlerAbstraction() {
        return FileBeforeBatchCreateEventHandler;
    }
}

/** Hook into file lifecycle before files are created in batch. */
export const FileBeforeBatchCreateEventHandler = createAbstraction<
    IEventHandler<FileBeforeBatchCreateEvent>
>("FileBeforeBatchCreateEventHandler");

export namespace FileBeforeBatchCreateEventHandler {
    export type Interface = IEventHandler<FileBeforeBatchCreateEvent>;
    export type Event = FileBeforeBatchCreateEvent;
}

// ============================================================================
// FileAfterBatchCreate Event
// ============================================================================

export interface FileAfterBatchCreatePayload {
    files: File[];
    meta?: Record<string, any>;
}

export class FileAfterBatchCreateEvent extends DomainEvent<FileAfterBatchCreatePayload> {
    eventType = "FileManager/File/AfterBatchCreate" as const;

    getHandlerAbstraction() {
        return FileAfterBatchCreateEventHandler;
    }
}

/** Hook into file lifecycle after files are created in batch. */
export const FileAfterBatchCreateEventHandler = createAbstraction<
    IEventHandler<FileAfterBatchCreateEvent>
>("FileAfterBatchCreateEventHandler");

export namespace FileAfterBatchCreateEventHandler {
    export type Interface = IEventHandler<FileAfterBatchCreateEvent>;
    export type Event = FileAfterBatchCreateEvent;
}
