import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { WbIdentity, WbLocation } from "~/domain/shared/abstractions.js";

/**
 * RedirectModel abstraction - represents the Website Builder redirect CMS model.
 * This will be registered via container.registerInstance in the composite feature.
 */
export const RedirectModel = createAbstraction<CmsModel>("RedirectModel");

export namespace RedirectModel {
    export type Interface = CmsModel;
}

export interface CmsEntryWbRedirect {
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}
/**
 * WbRedirect domain entity
 */
export interface WbRedirect extends CmsEntryWbRedirect {
    id: string;
    location: WbLocation;
    createdOn: string;
    createdBy: WbIdentity;
    savedOn: string;
    savedBy: WbIdentity;
    modifiedOn: string | null;
    modifiedBy: WbIdentity | null;
    tenant: string;
}
