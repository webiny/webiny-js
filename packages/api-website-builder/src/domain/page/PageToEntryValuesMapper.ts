import type { CmsEntryWbPage, WbPage } from "~/domain/page/abstractions.js";

/**
 * The page fields stored as CMS entry values. Used to save a page that a "before" event
 * handler may have changed.
 */
export class PageToEntryValuesMapper {
    static toValues(page: WbPage): CmsEntryWbPage {
        return {
            properties: page.properties,
            metadata: page.metadata,
            bindings: page.bindings,
            elements: page.elements,
            extensions: page.extensions
        };
    }
}
