import { EntryBeforePublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforePublishImpl implements EntryBeforePublishEventHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforePublishEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforePublish = EntryBeforePublishEventHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforePublishImpl,
    dependencies: [BlockActionIfModelDisabled]
});
