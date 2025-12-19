import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types";

/**
 * RedirectModel abstraction - represents the Website Builder redirect CMS model.
 * This will be registered via container.registerInstance in the composite feature.
 */
export const RedirectModel = createAbstraction<CmsModel>("RedirectModel");

export namespace RedirectModel {
    export type Interface = CmsModel;
}
