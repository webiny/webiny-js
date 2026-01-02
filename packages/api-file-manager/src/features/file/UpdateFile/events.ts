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
        return FileBeforeUpdateHandler;
    }
}

export const FileBeforeUpdateHandler =
    createAbstraction<IEventHandler<FileBeforeUpdateEvent>>("FileBeforeUpdateHandler");

export namespace FileBeforeUpdateHandler {
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
        return FileAfterUpdateHandler;
    }
}

export const FileAfterUpdateHandler =
    createAbstraction<IEventHandler<FileAfterUpdateEvent>>("FileAfterUpdateHandler");

export namespace FileAfterUpdateHandler {
    export type Interface = IEventHandler<FileAfterUpdateEvent>;
    export type Event = FileAfterUpdateEvent;
}
