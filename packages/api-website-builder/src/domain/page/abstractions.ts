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
export const PageModel = createAbstraction<CmsModel>("Wb/PageModel");

export namespace PageModel {
    export type Interface = CmsModel;
}
