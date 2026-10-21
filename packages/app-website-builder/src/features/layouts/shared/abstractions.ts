import { createAbstraction } from "@webiny/feature/admin";
import type { DocumentBindings, ElementMap } from "@webiny/website-builder-sdk";
import type { WbStatus } from "~/constants.js";
import type { WbIdentity } from "~/types.js";

export interface LayoutProperties {
    title: string;
    // The slug code names the layout by. Source layouts only; older ones may have none.
    slug?: string | null;
    // Language code of the layout; none on a site without languages.
    language?: string | null;
    // Entry id of the source layout; set only on a language version of it.
    sourceLayout?: string | null;
    [key: string]: any;
}

/**
 * One revision of a layout, built in the layout editor. Layouts are versioned like pages: drafts are
 * edited, a published revision is locked, and pages render the published revision.
 *
 * A source layout (no `properties.sourceLayout`) can have one language version per language. Pages
 * reference the source layout's entry id, and are rendered in the version in their language, if published.
 */
export interface Layout {
    // Revision id, e.g. "abc#0001".
    id: string;
    entryId: string;
    status: WbStatus;
    version: number;
    locked: boolean;
    // The published revision of the entry, or `null` if none is published.
    live: { version: number } | null;
    properties: LayoutProperties;
    metadata: Record<string, any>;
    elements: ElementMap;
    bindings: DocumentBindings;
    extensions: Record<string, any>;
    createdOn: string | null;
    savedOn: string | null;
    modifiedOn: string | null;
    createdBy: WbIdentity | null;
    savedBy: WbIdentity | null;
}

export interface CreateLayoutData {
    title: string;
    // Must be free; left out, the API makes one from the title.
    slug?: string;
    // Leave out (or `null`) on a site without languages.
    language?: string | null;
}

export interface UpdateLayoutData {
    properties?: Partial<LayoutProperties>;
    metadata?: Record<string, any>;
    elements?: Layout["elements"];
    bindings?: Layout["bindings"];
    extensions?: Record<string, any>;
}

export interface LayoutSettings {
    // Entry id of the source layout new pages get, or `null`.
    defaultLayout: string | null;
}

// Gateway

export interface ILayoutsGateway {
    // The latest revision of every layout: source layouts and their language versions.
    list(): Promise<Layout[]>;
    // A revision id, or an entry id for its latest revision.
    get(id: string): Promise<Layout>;
    getRevisions(entryId: string): Promise<Layout[]>;
    // The published layout a page in `language` is rendered in, or `null`.
    getPageLayout(layoutId: string, language: string | null): Promise<Layout | null>;
    getSettings(): Promise<LayoutSettings>;
    // A new layout starts with the Main content placeholder in it.
    create(data: CreateLayoutData): Promise<Layout>;
    update(id: string, data: UpdateLayoutData): Promise<Layout>;
    publish(id: string): Promise<Layout>;
    unpublish(id: string): Promise<Layout>;
    createRevisionFrom(id: string): Promise<Layout>;
    deleteRevision(id: string): Promise<void>;
    // An entry id. Deleting a source layout also deletes its language versions.
    delete(entryId: string): Promise<void>;
    duplicate(id: string): Promise<Layout>;
    translate(id: string, language: string): Promise<Layout>;
    setDefaultLayout(entryId: string | null): Promise<LayoutSettings>;
}

export const LayoutsGateway = createAbstraction<ILayoutsGateway>("WebsiteBuilder/LayoutsGateway");

export namespace LayoutsGateway {
    export type Interface = ILayoutsGateway;
}

// Repository

/**
 * Keeps the listed layouts, the loaded revisions and the layout settings in sync as layouts change.
 */
export interface ILayoutsRepository {
    // The latest revision of every listed layout, observable. Empty until `list()` was called.
    readonly layouts: Layout[];
    readonly loading: boolean;
    // `null` until `getSettings()` was called.
    readonly settings: LayoutSettings | null;
    // The loaded revisions of an entry, newest first, observable.
    getLoadedRevisions(entryId: string): Layout[];
    list(): Promise<Layout[]>;
    get(id: string): Promise<Layout>;
    getRevisions(entryId: string): Promise<Layout[]>;
    getPageLayout(layoutId: string, language: string | null): Promise<Layout | null>;
    getSettings(): Promise<LayoutSettings>;
    create(data: CreateLayoutData): Promise<Layout>;
    update(id: string, data: UpdateLayoutData): Promise<Layout>;
    publish(id: string): Promise<Layout>;
    unpublish(id: string): Promise<Layout>;
    createRevisionFrom(id: string): Promise<Layout>;
    deleteRevision(id: string): Promise<void>;
    delete(entryId: string): Promise<void>;
    duplicate(id: string): Promise<Layout>;
    translate(id: string, language: string): Promise<Layout>;
    setDefaultLayout(entryId: string | null): Promise<LayoutSettings>;
}

export const LayoutsRepository = createAbstraction<ILayoutsRepository>(
    "WebsiteBuilder/LayoutsRepository"
);

export namespace LayoutsRepository {
    export type Interface = ILayoutsRepository;
}
