import { EntryBeforeRepublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeRepublishImpl
    implements EntryBeforeRepublishEventHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeRepublishEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeRepublish =
    EntryBeforeRepublishEventHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeRepublishImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
