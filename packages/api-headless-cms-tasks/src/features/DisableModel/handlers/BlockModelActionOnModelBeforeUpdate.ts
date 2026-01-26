import { ModelBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnModelBeforeUpdateImpl implements ModelBeforeUpdateEventHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: ModelBeforeUpdateEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnModelBeforeUpdate = ModelBeforeUpdateEventHandler.createImplementation({
    implementation: BlockModelActionOnModelBeforeUpdateImpl,
    dependencies: [BlockActionIfModelDisabled]
});
