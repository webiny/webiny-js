import { createAbstraction } from "@webiny/feature/admin";

/**
 * Where a project's AI settings are changed, for the assistant's "Choose a model".
 *
 * Declared in core and implemented by the package that owns the settings screen, which knows its
 * route and who may change it. Nothing is registered when that package is not installed or not
 * licensed, so the assistant offers no way there rather than a link to a page that does not exist.
 */
export interface IAiSettingsLocation {
    /** Whether the signed-in user may change the settings. */
    canOpen(): boolean;
    open(): void;
}

export const AiSettingsLocation = createAbstraction<IAiSettingsLocation>("AiSettingsLocation");

export namespace AiSettingsLocation {
    export type Interface = IAiSettingsLocation;
}
