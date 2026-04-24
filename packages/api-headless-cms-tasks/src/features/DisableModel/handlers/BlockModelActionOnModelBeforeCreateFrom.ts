import { ModelBeforeCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnModelBeforeCreateFromImpl
    implements ModelBeforeCreateFromEventHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: ModelBeforeCreateFromEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnModelBeforeCreateFrom =
    ModelBeforeCreateFromEventHandler.createImplementation({
        implementation: BlockModelActionOnModelBeforeCreateFromImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
