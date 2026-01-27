import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeUpdateImpl implements EntryBeforeUpdateEventHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeUpdate =
    EntryBeforeUpdateEventHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeUpdateImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
