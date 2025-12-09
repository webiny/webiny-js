import { EntryBeforeUpdateHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeUpdateImpl implements EntryBeforeUpdateHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeUpdateHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeUpdate = EntryBeforeUpdateHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforeUpdateImpl,
    dependencies: [BlockActionIfModelDisabled]
});
