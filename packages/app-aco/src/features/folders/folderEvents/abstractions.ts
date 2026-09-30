import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { FolderCreatedEvent } from "./FolderCreatedEvent.js";

/**
 * Reacts to a folder created somewhere the admin did not see: by the assistant, a background task,
 * or anything else on the server. Folders the admin creates itself are already in its cache.
 */
export const FolderCreatedEventHandler = createAbstraction<IEventHandler<FolderCreatedEvent>>(
    "Aco/FolderCreatedEventHandler"
);

export namespace FolderCreatedEventHandler {
    export type Interface = IEventHandler<FolderCreatedEvent>;
    export type Event = FolderCreatedEvent;
}
