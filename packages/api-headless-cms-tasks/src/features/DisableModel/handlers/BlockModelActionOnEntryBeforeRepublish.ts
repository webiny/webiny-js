import { EntryBeforeRepublishHandler } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeRepublishImpl implements EntryBeforeRepublishHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeRepublishHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeRepublish =
    EntryBeforeRepublishHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeRepublishImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
