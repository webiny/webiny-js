import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, ICmsEntryLive } from "@webiny/api-headless-cms/types/index.js";
import type { WbIdentity } from "~/domain/shared/abstractions.js";

/**
 * Provides the tenant's private Website Builder layout CMS model, like `PageModelProvider`: fetching a
 * model is asynchronous and tenant-dependent, so consumers `await get()` at the point of use.
 */
export interface ILayoutModelProvider {
    get(): Promise<CmsModel>;
}

export const LayoutModelProvider =
    createAbstraction<ILayoutModelProvider>("Wb/LayoutModelProvider");

export namespace LayoutModelProvider {
    export type Interface = ILayoutModelProvider;
}

export interface CmsEntryWbLayoutProperties {
    title: string;
    // The language of a language version; a source layout may have one too.
    language?: string;
    // The entry id of the source layout. Set only on language versions.
    sourceLayout?: string;
    // The slug code names the layout by (see `LayoutSlug`). Source layouts only; older ones may have none.
    slug?: string;
    [key: string]: any;
}

export interface CmsEntryWbLayout {
    properties: CmsEntryWbLayoutProperties;
    metadata?: Record<string, any>;
    elements: Record<string, any>;
    bindings: Record<string, any>;
    extensions?: Record<string, any>;
}

/**
 * One revision of a page layout, built in the layout editor: the elements placed around the page content.
 * It holds exactly one `Webiny/LayoutContent` element (main content), where a page renders its own content,
 * and any number of `Webiny/NamedContent` elements, each an area of the page's content. A page stores its
 * content of a named area in the page root's slot named by the area's element id; the area's name is a label.
 * Global components are placed by placement elements; their instances are never stored in a layout.
 * Bindings under ids of elements the layout doesn't own (e.g. `$global:{name}`) are the layout's overrides.
 */
export interface Layout extends CmsEntryWbLayout {
    // The revision id, e.g. `abc#0001`.
    id: string;
    // The entry id. Pages reference a (source) layout by it.
    entryId: string;
    status: string;
    version: number;
    locked: boolean;
    live: ICmsEntryLive | null;
    revisionDescription: string;
    createdOn: string;
    savedOn: string;
    modifiedOn: string | null;
    createdBy: WbIdentity;
    savedBy: WbIdentity;
    modifiedBy: WbIdentity | null;
}

export type WbLayout = Layout;
