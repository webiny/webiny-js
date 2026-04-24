import { EntryRevisionBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryRevisionBeforeCreateImpl
    implements EntryRevisionBeforeCreateEventHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryRevisionBeforeCreateEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryRevisionBeforeCreate =
    EntryRevisionBeforeCreateEventHandler.createImplementation({
        implementation: BlockModelActionOnEntryRevisionBeforeCreateImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
