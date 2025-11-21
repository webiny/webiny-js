import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
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
        return FileBeforeDeleteHandler;
    }
}

export const FileBeforeDeleteHandler =
    createAbstraction<IEventHandler<FileBeforeDeleteEvent>>("FileBeforeDeleteHandler");

export namespace FileBeforeDeleteHandler {
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
        return FileAfterDeleteHandler;
    }
}

export const FileAfterDeleteHandler =
    createAbstraction<IEventHandler<FileAfterDeleteEvent>>("FileAfterDeleteHandler");

export namespace FileAfterDeleteHandler {
    export type Interface = IEventHandler<FileAfterDeleteEvent>;
    export type Event = FileAfterDeleteEvent;
}
