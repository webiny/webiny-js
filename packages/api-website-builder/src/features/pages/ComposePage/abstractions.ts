import { createAbstraction } from "@webiny/feature/api";
import type { WbPage } from "~/domain/page/abstractions.js";
import type { Layout } from "~/domain/layout/abstractions.js";

export interface ComposePageOptions {
    // Return the page as stored, with its layout as published: nothing merged.
    raw?: boolean;
}

// A page as delivered: with the layout it is rendered in (`null` for none).
export type ComposedWbPage = WbPage & { layout: Layout | null };

export interface IComposePageUseCase {
    /**
     * Never fails: if the layout or the global components can't be read, the page is delivered without them.
     */
    execute(page: WbPage, options?: ComposePageOptions): Promise<ComposedWbPage>;
}

/**
 * Compose a page for delivery. The layout is resolved for the page's `properties.layout` and language
 * (see `GetPageLayoutUseCase`); the global components come in the page's language, or else in `"default"`.
 * - Composed: instance elements of the globals are added, global bindings are merged record → layout
 *   override → page override, and the layout's own elements get the page's overrides merged in.
 * - Raw: the page as stored, with the resolved published layout as stored.
 */
export const ComposePageUseCase = createAbstraction<IComposePageUseCase>("Wb/ComposePageUseCase");

export namespace ComposePageUseCase {
    export type Interface = IComposePageUseCase;
    export type Options = ComposePageOptions;
    export type Page = WbPage;
    export type ComposedPage = ComposedWbPage;
    export type Return = Promise<ComposedWbPage>;
}
