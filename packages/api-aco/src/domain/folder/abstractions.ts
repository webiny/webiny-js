import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * FolderModel abstraction - represents the ACO folder CMS model.
 * This will be registered via container.registerInstance in the composite feature.
 */
export const FolderModel = createAbstraction<CmsModel>("FolderModel");

export namespace FolderModel {
    export type Interface = CmsModel;
}
