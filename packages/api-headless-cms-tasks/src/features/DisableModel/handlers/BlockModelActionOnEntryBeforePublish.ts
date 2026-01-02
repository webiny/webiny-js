import { EntryBeforePublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforePublishImpl implements EntryBeforePublishHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforePublishHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforePublish = EntryBeforePublishHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforePublishImpl,
    dependencies: [BlockActionIfModelDisabled]
});
