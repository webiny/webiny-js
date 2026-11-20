import { createAbstraction } from "@webiny/feature/admin";
import type { Theme } from "~/config/AdminConfig/Theme/types.js";

export interface IThemeSelection {
    /** The id of the theme selected in this browser, or `undefined` when none has been. */
    getThemeId(): string | undefined;

    /**
     * The selected theme's variables as they were stored when it was selected. They paint the
     * theme on load, before the extension that registers it has rendered.
     */
    getStoredVariables(): Record<string, string> | undefined;

    /**
     * Stores the theme's id and variables. Selecting the theme that is already selected refreshes
     * its stored variables; nothing is written when they are unchanged.
     */
    select(theme: Theme): void;
}

export const ThemeSelection = createAbstraction<IThemeSelection>("Admin/ThemeSelection");

export namespace ThemeSelection {
    export type Interface = IThemeSelection;
}

export interface IThemeVariablesWriter {
    /**
     * Sets the variables as inline custom properties on `<html>` and removes the ones the
     * previous call set that this one doesn't.
     */
    write(variables: Record<string, string>): void;
}

export const ThemeVariablesWriter = createAbstraction<IThemeVariablesWriter>(
    "Admin/ThemeVariablesWriter"
);

export namespace ThemeVariablesWriter {
    export type Interface = IThemeVariablesWriter;
}
