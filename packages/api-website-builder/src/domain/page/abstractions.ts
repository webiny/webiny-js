import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    IEntryState,
    CmsEntryListSort,
    CmsEntryListWhere
} from "@webiny/api-headless-cms/types/index.js";
import type { WbIdentity, WbLocation } from "~/domain/shared/abstractions.js";

export interface WbPage {
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
    state?: IEntryState;

    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface ListPagesParams {
    where: CmsEntryListWhere;
    sort: CmsEntryListSort;
    limit: number;
    after: string | null;
    search?: string;
}

export interface ListPagesMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

/**
 * PageModel abstraction - represents the Website Builder page CMS model.
 * This will be registered via container.registerInstance in the composite feature.
 */
export const PageModel = createAbstraction<CmsModel>("PageModel");

export namespace PageModel {
    export type Interface = CmsModel;
}
