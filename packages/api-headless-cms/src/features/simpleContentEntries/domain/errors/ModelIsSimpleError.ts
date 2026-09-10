import { BaseError } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export class ModelIsSimpleError extends BaseError {
    override readonly code = "Cms/SimpleEntry/ModelIsSimple" as const;

    constructor(model: Pick<CmsModel, "modelId">) {
        super({
            message: `Model "${model.modelId}" is a simple model, so it cannot be used through the regular entry operations.`
        });
    }
}
