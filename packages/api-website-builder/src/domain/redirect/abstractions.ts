import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { WbIdentity, WbLocation } from "~/domain/shared/abstractions.js";

/**
 * Provides the tenant's Website Builder redirect CMS model.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * while DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by
 * something running before every consumer. Consumers `await get()` at the point of use.
 */
export interface IRedirectModelProvider {
    get(): Promise<CmsModel>;
}

export const RedirectModelProvider = createAbstraction<IRedirectModelProvider>(
    "Wb/RedirectModelProvider"
);

export namespace RedirectModelProvider {
    export type Interface = IRedirectModelProvider;
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
