import { createAbstraction } from "@webiny/feature/admin";

/**
 * What the user has on screen, sent to the assistant with each question so it can resolve "this
 * folder", "Archive" or "these entries" without searching for them. `view` says what the screen is
 * ("Entries of the Product content model"); `details` holds the ids and titles a question might
 * refer to. Keep it to ids, titles and types: never record contents. The server drops details over
 * a few kilobytes.
 */
export interface AssistantPageContextData {
    view: string;
    details: Record<string, unknown>;
}

/** Identifies one `set`, so a view that unmounts late cannot clear the context a newer view set. */
export type AssistantPageContextOwner = symbol;

export interface IAssistantPageContext {
    /** Replace the current context. Returns the owner to pass to `clear`. */
    set(context: AssistantPageContextData): AssistantPageContextOwner;
    /** Clear the context, if it is still the one this owner set. */
    clear(owner: AssistantPageContextOwner): void;
    get(): AssistantPageContextData | null;
}

/** The screen the user is on, as the assistant should know it. Views set it with `useAssistantPageContext`. */
export const AssistantPageContext =
    createAbstraction<IAssistantPageContext>("AssistantPageContext");

export namespace AssistantPageContext {
    export type Interface = IAssistantPageContext;
    export type Data = AssistantPageContextData;
    export type Owner = AssistantPageContextOwner;
}
