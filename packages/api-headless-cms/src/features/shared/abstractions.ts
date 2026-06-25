import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsContext as CmsCtx,
    CmsEntryValues,
    HeadlessCms as HeadlessCmsApi,
    HeadlessCmsStorageOperations as StorageOps,
    StorageOperationsCmsModel
} from "~/types/types.js";
import type { CmsModel } from "~/types/model.js";
import type { AccessControl as AccessControlClass } from "~/crud/AccessControl/AccessControl.js";

/**
 * DI token for the HeadlessCms facade (the object previously exposed as `context.cms`).
 * Resolve it via the container instead of reading `context.cms`. The facade itself is a
 * legacy god-object and is expected to be decomposed into use-cases in a later phase.
 */
export const HeadlessCms = createAbstraction<HeadlessCmsApi>("HeadlessCms");

export namespace HeadlessCms {
    export type Interface = HeadlessCmsApi;
}

/**
 * Provides the storage representation of a CMS model (with value-key converters attached),
 * cached per model. Replaces the StorageOperationsCmsModelPlugin read from the plugins
 * container; storage adapters resolve this from the DI container.
 */
export interface ICmsStorageModelProvider {
    getModel<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): StorageOperationsCmsModel<T>;
}

export const CmsStorageModelProvider =
    createAbstraction<ICmsStorageModelProvider>("CmsStorageModelProvider");

export namespace CmsStorageModelProvider {
    export type Interface = ICmsStorageModelProvider;
}

/**
 * StorageOperations abstraction for legacy storage operations.
 * The legacy implementation will be registered using container.registerInstance.
 */
export const StorageOperations = createAbstraction<StorageOps>("StorageOperations");

export namespace StorageOperations {
    export type Interface = StorageOps;
}

export interface IHeadlessCmsStorageOperationsFactory<T> {
    create(context: T): Promise<StorageOps>;
}

export const StorageOperationsFactory = createAbstraction<
    IHeadlessCmsStorageOperationsFactory<any>
>("Cms/StorageOperationsFactory");

export namespace StorageOperationsFactory {
    export type Interface<T extends CmsCtx = CmsCtx> = IHeadlessCmsStorageOperationsFactory<T>;
    export type Result = StorageOps;
}

/**
 * AccessControl abstraction for legacy access control.
 * The legacy implementation will be registered using container.registerInstance.
 */
export const AccessControl = createAbstraction<AccessControlClass>("AccessControl");

export namespace AccessControl {
    export type Interface = AccessControlClass;
}

/**
 * CmsContext abstraction for legacy CMS context.
 * The legacy implementation will be registered using container.registerInstance.
 */
export const CmsContext = createAbstraction<CmsCtx>("CmsContext");

export namespace CmsContext {
    export type Interface = CmsCtx;
}

export interface IAccessControl {
    canAccessModel(params: { model: any }): Promise<boolean>;
    canAccessGroup(params: { group: any }): Promise<boolean>;
}
