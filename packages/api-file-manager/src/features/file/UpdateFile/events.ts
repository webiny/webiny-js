import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { File } from "~/domain/file/types.js";
import type { UpdateFileInput } from "./abstractions.js";

// ============================================================================
// FileBeforeUpdate Event
// ============================================================================

export interface FileBeforeUpdatePayload {
    original: File;
    file: File;
    input: UpdateFileInput;
}

export class FileBeforeUpdateEvent extends DomainEvent<FileBeforeUpdatePayload> {
    eventType = "FileManager/File/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return FileBeforeUpdateEventHandler;
    }
}

/** Hook into file lifecycle before a file is updated. */
export const FileBeforeUpdateEventHandler = createAbstraction<IEventHandler<FileBeforeUpdateEvent>>(
    "FileBeforeUpdateEventHandler"
);

export namespace FileBeforeUpdateEventHandler {
    export type Interface = IEventHandler<FileBeforeUpdateEvent>;
    export type Event = FileBeforeUpdateEvent;
}

// ============================================================================
// FileAfterUpdate Event
// ============================================================================

export interface FileAfterUpdatePayload {
    original: File;
    file: File;
    input: UpdateFileInput;
}

export class FileAfterUpdateEvent extends DomainEvent<FileAfterUpdatePayload> {
    eventType = "FileManager/File/AfterUpdate" as const;

    getHandlerAbstraction() {
        return FileAfterUpdateEventHandler;
    }
}

/** Hook into file lifecycle after a file is updated. */
export const FileAfterUpdateEventHandler = createAbstraction<IEventHandler<FileAfterUpdateEvent>>(
    "FileAfterUpdateEventHandler"
);

export namespace FileAfterUpdateEventHandler {
    export type Interface = IEventHandler<FileAfterUpdateEvent>;
    export type Event = FileAfterUpdateEvent;
}
