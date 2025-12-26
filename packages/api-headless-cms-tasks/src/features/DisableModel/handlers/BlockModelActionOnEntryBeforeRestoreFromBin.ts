import { EntryBeforeRestoreFromBinHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeRestoreFromBinImpl
    implements EntryBeforeRestoreFromBinHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeRestoreFromBinHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeRestoreFromBin =
    EntryBeforeRestoreFromBinHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeRestoreFromBinImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
