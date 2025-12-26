import { ModelBeforeUpdateHandler } from "@webiny/api-headless-cms/features/contentModel/UpdateModel/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnModelBeforeUpdateImpl implements ModelBeforeUpdateHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: ModelBeforeUpdateHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnModelBeforeUpdate = ModelBeforeUpdateHandler.createImplementation({
    implementation: BlockModelActionOnModelBeforeUpdateImpl,
    dependencies: [BlockActionIfModelDisabled]
});
