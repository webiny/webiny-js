import { createAbstraction } from "@webiny/feature/admin";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";

/**
 * Global components in the layout editor. A layout is loaded as stored: its own elements (with the
 * placements of globals), and its overrides of globals. Once it's open, the globals' records (in the
 * layout's language, or "default") are composed into it.
 */
export type ILayoutGlobalComponentsPresenter = GlobalComponentsPresenter.Interface;

export const LayoutGlobalComponentsPresenter = createAbstraction<ILayoutGlobalComponentsPresenter>(
    "LayoutEditor/GlobalComponentsPresenter"
);

export namespace LayoutGlobalComponentsPresenter {
    export type Interface = ILayoutGlobalComponentsPresenter;
    export type ViewModel = GlobalComponentsPresenter.ViewModel;
}
