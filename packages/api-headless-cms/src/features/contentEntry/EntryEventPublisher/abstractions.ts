import { createAbstraction } from "@webiny/feature/api";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsModel } from "~/types/index.js";

export type EntryDomainEvent = DomainEvent<{ model: CmsModel }>;

/**
 * Publishes entry lifecycle events (Cms/Entry/*).
 * Events are not published for private models which have lifecycle events disabled.
 */
export interface IEntryEventPublisher {
    publish<TEvent extends EntryDomainEvent>(event: TEvent): Promise<void>;
}

export const EntryEventPublisher = createAbstraction<IEntryEventPublisher>(
    "Cms/Entry/EntryEventPublisher"
);

export namespace EntryEventPublisher {
    export type Interface = IEntryEventPublisher;
}
