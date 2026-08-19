import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsContext as CmsCtx,
    CmsEntryValues,
    HeadlessCms as HeadlessCmsApi,
    StorageOperationsCmsModel
} from "~/types/types.js";
import type { CmsModel } from "~/types/model.js";
import type { AccessControl as AccessControlClass } from "~/crud/AccessControl/AccessControl.js";

export const HeadlessCms = createAbstraction<HeadlessCmsApi>("HeadlessCms");

export namespace HeadlessCms {
    export type Interface = HeadlessCmsApi;
}

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
