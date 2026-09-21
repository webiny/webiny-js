import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    ICmsEntryLive,
    ICmsEntrySystem
} from "@webiny/api-headless-cms/types/index.js";
import type { WbIdentity, WbLocation } from "~/domain/shared/abstractions.js";

export interface CmsEntryWbPageProperties {
    title: string;
    [key: string]: any;
}

export interface CmsEntryWbPage {
    properties: CmsEntryWbPageProperties;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface WbPage extends CmsEntryWbPage {
    id: string;
    entryId: string;
    location: WbLocation;
    status: string;
    version: number;
    locked: boolean;
    createdOn: string;
    createdBy: WbIdentity;
    savedOn: string;
    savedBy: WbIdentity;
    modifiedOn: string | null;
    modifiedBy: WbIdentity | null;
    deletedOn: string | null;
    deletedBy: WbIdentity | null;
    tenant: string;
    system?: ICmsEntrySystem;
    deleted: boolean;
    live: ICmsEntryLive | null;
    revisionDescription: string;
}

export interface WbPageRevision {
    id: string;
    entryId: string;
    version: number;
    title: string;
    status: string;
    locked: boolean;
    savedOn: string;
    createdOn: string;
    createdBy: WbIdentity;
    revisionDescription: string;
}

/**
 * PageModel abstraction - represents the Website Builder page CMS model.
 * This will be registered via container.registerInstance in the composite feature.
 */
/**
 * Provides the tenant's Website Builder page CMS model.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * while DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by
 * something running before every consumer. Consumers `await get()` at the point of use.
 */
export interface IPageModelProvider {
    get(): Promise<CmsModel>;
}

export const PageModelProvider = createAbstraction<IPageModelProvider>("Wb/PageModelProvider");

export namespace PageModelProvider {
    export type Interface = IPageModelProvider;
}
