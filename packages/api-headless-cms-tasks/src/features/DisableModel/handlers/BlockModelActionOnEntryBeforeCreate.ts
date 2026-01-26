import { EntryBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeCreateImpl implements EntryBeforeCreateEventHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeCreateEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeCreate = EntryBeforeCreateEventHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforeCreateImpl,
    dependencies: [BlockActionIfModelDisabled]
});
