import { EntryBeforeCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeCreateImpl implements EntryBeforeCreateHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeCreateHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeCreate = EntryBeforeCreateHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforeCreateImpl,
    dependencies: [BlockActionIfModelDisabled]
});
