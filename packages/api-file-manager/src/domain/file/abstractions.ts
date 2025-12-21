import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * FileModel abstraction - represents the fmFile CMS model.
 * This will be registered via container.registerInstance in the composite feature.
 */
export const FileModel = createAbstraction<CmsModel>("FileModel");

export namespace FileModel {
    export type Interface = CmsModel;
}
