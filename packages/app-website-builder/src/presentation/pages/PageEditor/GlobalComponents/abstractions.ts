import { createAbstraction } from "@webiny/feature/admin";
import type { EditorPage, GlobalComponentRecord } from "@webiny/website-builder-sdk";
import type { GlobalComponentsPresenter } from "~/presentation/globals/overrides/abstractions.js";

/**
 * Global components and the layout's own elements in the page editor. A page is loaded as stored: its own
 * elements, and its overrides of others. Before it's opened, the global components' records (in the
 * page's language, or "default") and its layout are composed into it.
 */
export interface IPageGlobalComponentsPresenter extends GlobalComponentsPresenter.Interface {
    /**
     * Compose a page, as stored, with the records of the globals, for the editor to open. `null` when
     * they couldn't be listed: globals show their defaults, and can't be saved in the global component.
     */
    prepare(page: EditorPage, records: GlobalComponentRecord[] | null): EditorPage;
}

export const PageGlobalComponentsPresenter = createAbstraction<IPageGlobalComponentsPresenter>(
    "PageEditor/GlobalComponentsPresenter"
);

export namespace PageGlobalComponentsPresenter {
    export type Interface = IPageGlobalComponentsPresenter;
    export type ViewModel = GlobalComponentsPresenter.ViewModel;
}
