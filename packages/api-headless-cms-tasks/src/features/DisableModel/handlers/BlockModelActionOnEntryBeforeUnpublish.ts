import { EntryBeforeUnpublishHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeUnpublishImpl implements EntryBeforeUnpublishHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeUnpublishHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeUnpublish =
    EntryBeforeUnpublishHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeUnpublishImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
