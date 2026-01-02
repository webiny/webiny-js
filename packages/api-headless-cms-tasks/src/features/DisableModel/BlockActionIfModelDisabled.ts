import { WebinyError } from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { BlockActionIfModelDisabled as Abstraction } from "./abstractions.js";
import type { HeadlessCmsFullyDeleteModel } from "~/types.js";

export class BlockActionIfModelDisabled implements Abstraction.Interface {
    constructor(private isModelBeingDeleted: HeadlessCmsFullyDeleteModel["isModelBeingDeleted"]) {}

    async execute(model: CmsModel): Promise<void> {
        const isBeingDeleted = await this.isModelBeingDeleted(model.modelId);
        if (!isBeingDeleted) {
            return;
        }

        throw new WebinyError(
            `Model "${model.name}" is being deleted and you cannot create, update or delete any entries of this model.`
        );
    }
}
