import type React from "react";
import { createAbstraction } from "@webiny/feature/admin";

/**
 * Something a screen puts under the assistant's question box while the user is on it, such as the
 * page editor's project and persona pickers. What the control is set to goes to the server with
 * every request, under the control's `name`, until the screen removes it.
 */
export interface AssistantComposerControl {
    /** The key its value is sent under. The server reads only the names it knows. */
    name: string;
    /** Rendered above the question box. */
    element: React.ReactNode;
    /** What the control is set to now, small and JSON-safe. Undefined sends nothing. */
    value(): unknown;
}

/** Identifies one `register`, so each screen removes only the controls it added. */
export type AssistantComposerControlsOwner = symbol;

export interface IAssistantComposerControls {
    /** Show these controls until `unregister` is called with the returned owner. */
    register(controls: AssistantComposerControl[]): AssistantComposerControlsOwner;
    unregister(owner: AssistantComposerControlsOwner): void;
    /** Every control shown now, oldest registration first. A newer one wins a name both use. */
    list(): AssistantComposerControl[];
    /** The values to send, by control name. Empty when no control is set. */
    values(): Record<string, unknown>;
}

/**
 * The controls the screen the user is on adds to the assistant's composer. A screen registers them
 * when it mounts and unregisters them when it goes, so the composer anywhere else shows none.
 */
export const AssistantComposerControls = createAbstraction<IAssistantComposerControls>(
    "AssistantComposerControls"
);

export namespace AssistantComposerControls {
    export type Interface = IAssistantComposerControls;
    export type Control = AssistantComposerControl;
    export type Owner = AssistantComposerControlsOwner;
}
