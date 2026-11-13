import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

/**
 * An additional access rule for a content model, on top of the Headless CMS permissions.
 * When a guard handles a model and denies access, the model and its entries are not accessible,
 * whatever the Headless CMS permissions allow.
 *
 * Use it for a model that belongs to another application with its own permission.
 */
export interface IModelAccessGuard {
    /** Does this guard apply to the given model? */
    canHandle(model: Pick<CmsModel, "modelId">): boolean;
    /** May the current identity access the model and its entries? */
    canAccess(): Promise<boolean>;
}

export const ModelAccessGuard = createAbstraction<IModelAccessGuard>("Cms/ModelAccessGuard");

export namespace ModelAccessGuard {
    export type Interface = IModelAccessGuard;
}
