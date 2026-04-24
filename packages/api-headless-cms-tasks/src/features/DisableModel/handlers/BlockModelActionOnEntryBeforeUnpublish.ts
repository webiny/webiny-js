import { EntryBeforeUnpublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeUnpublishImpl
    implements EntryBeforeUnpublishEventHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeUnpublishEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeUnpublish =
    EntryBeforeUnpublishEventHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeUnpublishImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
