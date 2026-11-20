import { createAbstraction } from "@webiny/feature/api";
import type { Layout } from "~/domain/layout/abstractions.js";

export interface ComposeLayoutOptions {
    // The language of the content rendered in the layout: its global components come in it.
    language?: string | null;
}

/**
 * A layout as delivered for content that isn't a page (e.g. a CMS entry): like a page with no elements of
 * its own, rendered in the layout.
 * - `elements` / `bindings`: the instance elements and bindings of the global components the layout can
 *   place, with the layout's overrides of them merged in,
 * - `layout`: the layout itself, as published.
 */
export interface ComposedLayout {
    elements: Record<string, any>;
    bindings: Record<string, any>;
    layout: Layout;
}

export interface IComposeLayoutUseCase {
    /**
     * Never fails: if the global components can't be read, the layout is delivered without them, and the
     * frontend renders them from their manifest defaults.
     */
    execute(layout: Layout, options?: ComposeLayoutOptions): Promise<ComposedLayout>;
}

/**
 * Compose a layout for delivery, the way a page with no content is composed (see `ComposePageUseCase`): the
 * global components come in the given language, or else in the site's default language, or else `"default"`.
 */
export const ComposeLayoutUseCase =
    createAbstraction<IComposeLayoutUseCase>("Wb/ComposeLayoutUseCase");

export namespace ComposeLayoutUseCase {
    export type Interface = IComposeLayoutUseCase;
    export type Options = ComposeLayoutOptions;
    export type Composed = ComposedLayout;
    export type Return = Promise<ComposedLayout>;
}
