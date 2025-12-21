import { EntryRevisionBeforeCreateHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryRevisionBeforeCreateImpl
    implements EntryRevisionBeforeCreateHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryRevisionBeforeCreateHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryRevisionBeforeCreate =
    EntryRevisionBeforeCreateHandler.createImplementation({
        implementation: BlockModelActionOnEntryRevisionBeforeCreateImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
