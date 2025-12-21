import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { File, FileInput } from "~/domain/file/types.js";

// ============================================================================
// FileBeforeCreate Event
// ============================================================================

export interface FileBeforeCreatePayload {
    file: FileInput;
    meta?: Record<string, any>;
}

export class FileBeforeCreateEvent extends DomainEvent<FileBeforeCreatePayload> {
    eventType = "FileManager/File/BeforeCreate" as const;

    getHandlerAbstraction() {
        return FileBeforeCreateHandler;
    }
}

export const FileBeforeCreateHandler =
    createAbstraction<IEventHandler<FileBeforeCreateEvent>>("FileBeforeCreateHandler");

export namespace FileBeforeCreateHandler {
    export type Interface = IEventHandler<FileBeforeCreateEvent>;
    export type Event = FileBeforeCreateEvent;
}

// ============================================================================
// FileAfterCreate Event
// ============================================================================

export interface FileAfterCreatePayload {
    file: File;
    meta?: Record<string, any>;
}

export class FileAfterCreateEvent extends DomainEvent<FileAfterCreatePayload> {
    eventType = "FileManager/File/AfterCreate" as const;

    getHandlerAbstraction() {
        return FileAfterCreateHandler;
    }
}

export const FileAfterCreateHandler =
    createAbstraction<IEventHandler<FileAfterCreateEvent>>("FileAfterCreateHandler");

export namespace FileAfterCreateHandler {
    export type Interface = IEventHandler<FileAfterCreateEvent>;
    export type Event = FileAfterCreateEvent;
}
