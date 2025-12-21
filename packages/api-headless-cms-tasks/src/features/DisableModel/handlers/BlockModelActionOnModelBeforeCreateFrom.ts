import { ModelBeforeCreateFromHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnModelBeforeCreateFromImpl
    implements ModelBeforeCreateFromHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: ModelBeforeCreateFromHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnModelBeforeCreateFrom =
    ModelBeforeCreateFromHandler.createImplementation({
        implementation: BlockModelActionOnModelBeforeCreateFromImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
