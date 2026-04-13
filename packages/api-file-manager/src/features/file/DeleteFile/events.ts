import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { File } from "~/domain/file/types.js";

// ============================================================================
// FileBeforeDelete Event
// ============================================================================

export interface FileBeforeDeletePayload {
    file: File;
}

export class FileBeforeDeleteEvent extends DomainEvent<FileBeforeDeletePayload> {
    eventType = "FileManager/File/BeforeDelete" as const;

    getHandlerAbstraction() {
        return FileBeforeDeleteEventHandler;
    }
}

/** Hook into file lifecycle before a file is deleted. */
export const FileBeforeDeleteEventHandler = createAbstraction<IEventHandler<FileBeforeDeleteEvent>>(
    "FileBeforeDeleteEventHandler"
);

export namespace FileBeforeDeleteEventHandler {
    export type Interface = IEventHandler<FileBeforeDeleteEvent>;
    export type Event = FileBeforeDeleteEvent;
}

// ============================================================================
// FileAfterDelete Event
// ============================================================================

export interface FileAfterDeletePayload {
    file: File;
}

export class FileAfterDeleteEvent extends DomainEvent<FileAfterDeletePayload> {
    eventType = "FileManager/File/AfterDelete" as const;

    getHandlerAbstraction() {
        return FileAfterDeleteEventHandler;
    }
}

/** Hook into file lifecycle after a file is deleted. */
export const FileAfterDeleteEventHandler = createAbstraction<IEventHandler<FileAfterDeleteEvent>>(
    "FileAfterDeleteEventHandler"
);

export namespace FileAfterDeleteEventHandler {
    export type Interface = IEventHandler<FileAfterDeleteEvent>;
    export type Event = FileAfterDeleteEvent;
}
