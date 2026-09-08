import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { WbIdentity } from "~/domain/shared/abstractions.js";

export type VariantStatus = "draft" | "ready";

/**
 * The content snapshot of a variant. Mirrors the page content fields exactly so a variant
 * can be created as a copy of the baseline revision's content and then modified.
 */
export interface WbVariantContent {
    properties: Record<string, any>;
    metadata: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface CmsEntryWbVariantValues extends WbVariantContent {
    experimentId: string;
    name: string;
    status: VariantStatus;
}

export interface WbVariant extends CmsEntryWbVariantValues {
    id: string;
    entryId: string;
    version: number;
    locked: boolean;
    createdOn: string;
    createdBy: WbIdentity;
    savedOn: string;
    savedBy: WbIdentity;
    tenant: string;
}

/**
 * VariantModel abstraction - represents the Website Builder variant CMS model.
 * Registered via container.registerInstance in the composite feature.
 */
/**
 * Provides the tenant's Website Builder variant CMS model.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * while DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by
 * something running before every consumer. Consumers `await get()` at the point of use.
 */
export interface IVariantModelProvider {
    get(): Promise<CmsModel>;
}

export const VariantModelProvider =
    createAbstraction<IVariantModelProvider>("Wb/VariantModelProvider");

export namespace VariantModelProvider {
    export type Interface = IVariantModelProvider;
}
