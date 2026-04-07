import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsContext as CmsCtx,
    HeadlessCmsStorageOperations as StorageOps
} from "~/types/types.js";
import type { AccessControl as AccessControlClass } from "~/crud/AccessControl/AccessControl.js";

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
