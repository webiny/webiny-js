import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ActiveThemePointer } from "~/domain/theme/abstractions.js";
import type { ThemePersistenceError } from "~/domain/theme/errors.js";

/**
 * The tenant's active theme pointer.
 *
 * "No active theme" is a first-class, permanently supported state — see the design brief, section 9
 * — so `get` returns `null` rather than failing when nothing is set. Many projects will never opt
 * in, and an absent pointer must not read as an error anywhere in the stack.
 */
export interface IActiveThemeStore {
    get(): Promise<Result<ActiveThemePointer | null, ThemePersistenceError>>;
    set(pointer: ActiveThemePointer): Promise<Result<void, ThemePersistenceError>>;
    clear(): Promise<Result<void, ThemePersistenceError>>;
}

export const ActiveThemeStore = createAbstraction<IActiveThemeStore>("Theme/ActiveThemeStore");

export namespace ActiveThemeStore {
    export type Interface = IActiveThemeStore;
    export type Pointer = ActiveThemePointer;
}
