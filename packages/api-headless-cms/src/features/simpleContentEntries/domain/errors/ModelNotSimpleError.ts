import { BaseError } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export class ModelNotSimpleError extends BaseError {
    override readonly code = "Cms/SimpleEntry/ModelNotSimple" as const;

    constructor(model: Pick<CmsModel, "modelId">) {
        super({
            message: `Model "${model.modelId}" is not a simple model, so it cannot be used through the simple entry operations.`
        });
    }
}
