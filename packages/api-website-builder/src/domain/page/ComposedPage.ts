import type { GlobalComponent } from "~/domain/globals/abstractions.js";
import type { Layout } from "~/domain/layout/abstractions.js";
import { ElementBindings } from "~/domain/shared/ElementBindings.js";

type Elements = Record<string, any>;
type Bindings = Record<string, any>;

interface ComposableDocument {
    elements?: Elements;
    bindings?: Bindings;
}

interface ComposePageParams {
    layout: Layout | null;
    globalComponents: GlobalComponent[];
}

/**
 * A page composed for delivery, from the page as stored, the published layout it is rendered in, and the
 * global component records of its language:
 * - `elements`: the page's elements, plus the instance elements of every global record,
 * - `bindings`: the page's bindings; every global (or global descendant) id gets its layers merged:
 *   record, then the layout's override, then the page's override,
 * - `layout`: the layout, with the bindings of its own elements merged with the page's overrides of them.
 */
export class ComposedPage<T extends ComposableDocument> {
    private readonly page: T & { layout: Layout | null };

    private constructor(page: T & { layout: Layout | null }) {
        this.page = page;
    }

    static compose<T extends ComposableDocument>(
        page: T,
        { layout, globalComponents }: ComposePageParams
    ): ComposedPage<T> {
        const asObject = ComposedPage.asObject;
        const pageElements = asObject(page.elements);
        const pageBindings = asObject(page.bindings);
        const layoutElements = asObject(layout?.elements);
        const layoutBindings = asObject(layout?.bindings);

        // The page's overrides of the layout's own elements.
        const layoutElementOverrides: Bindings = {};
        // Everything else the page binds that it doesn't own: overrides of globals.
        const pageGlobalOverrides: Bindings = {};
        const bindings: Bindings = {};

        for (const id in pageBindings) {
            if (pageElements[id]) {
                bindings[id] = pageBindings[id];
            } else if (layoutElements[id]) {
                layoutElementOverrides[id] = pageBindings[id];
                bindings[id] = pageBindings[id];
            } else {
                pageGlobalOverrides[id] = pageBindings[id];
            }
        }

        // The layout's bindings of elements it doesn't own are its overrides of globals.
        const layoutGlobalOverrides: Bindings = {};
        for (const id in layoutBindings) {
            if (!layoutElements[id]) {
                layoutGlobalOverrides[id] = layoutBindings[id];
            }
        }

        const elements: Elements = { ...pageElements };
        const recordBindings: Bindings = {};
        for (const globalComponent of globalComponents) {
            Object.assign(elements, asObject(globalComponent.elements));
            Object.assign(recordBindings, asObject(globalComponent.bindings));
        }

        const globalIds = new Set([
            ...Object.keys(recordBindings),
            ...Object.keys(layoutGlobalOverrides),
            ...Object.keys(pageGlobalOverrides)
        ]);
        for (const id of globalIds) {
            const merged = ElementBindings.from(recordBindings[id])
                .mergeWith(layoutGlobalOverrides[id])
                .mergeWith(pageGlobalOverrides[id])
                .toJSON();
            if (merged) {
                bindings[id] = merged;
            }
        }

        let composedLayout: Layout | null = null;
        if (layout) {
            const composedLayoutBindings: Bindings = { ...layoutBindings };
            for (const id in layoutElementOverrides) {
                const merged = ElementBindings.from(layoutBindings[id])
                    .mergeWith(layoutElementOverrides[id])
                    .toJSON();
                if (merged) {
                    composedLayoutBindings[id] = merged;
                }
            }
            composedLayout = { ...layout, bindings: composedLayoutBindings };
        }

        // Nothing to add: keep the page's own values as they are.
        const unchanged = globalComponents.length === 0 && globalIds.size === 0;

        return new ComposedPage({
            ...page,
            elements: unchanged ? page.elements : elements,
            bindings: unchanged ? page.bindings : bindings,
            layout: composedLayout
        });
    }

    private static asObject(value: unknown): Record<string, any> {
        return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
    }

    toJSON(): T & { layout: Layout | null } {
        return this.page;
    }
}
