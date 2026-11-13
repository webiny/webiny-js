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

/** Identifies one `set`, so each view clears only the context it set. */
export type AssistantPageContextOwner = symbol;

export interface IAssistantPageContext {
    /** Put a context in front of any earlier one. Returns the owner to pass to `clear`. */
    set(context: AssistantPageContextData): AssistantPageContextOwner;
    /** Remove the context this owner set. The one before it, if any, is current again. */
    clear(owner: AssistantPageContextOwner): void;
    /** The newest context still set. */
    get(): AssistantPageContextData | null;
}

/**
 * The screen the user is on, as the assistant should know it. A view's presenter sets it when the
 * view starts and clears it when the view is disposed.
 */
export const AssistantPageContext =
    createAbstraction<IAssistantPageContext>("AssistantPageContext");

export namespace AssistantPageContext {
    export type Interface = IAssistantPageContext;
    export type Data = AssistantPageContextData;
    export type Owner = AssistantPageContextOwner;
}
