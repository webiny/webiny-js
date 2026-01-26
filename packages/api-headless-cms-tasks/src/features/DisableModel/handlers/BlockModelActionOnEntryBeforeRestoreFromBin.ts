import { EntryBeforeRestoreFromBinEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeRestoreFromBinImpl
    implements EntryBeforeRestoreFromBinEventHandler.Interface
{
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeRestoreFromBinEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeRestoreFromBin =
    EntryBeforeRestoreFromBinEventHandler.createImplementation({
        implementation: BlockModelActionOnEntryBeforeRestoreFromBinImpl,
        dependencies: [BlockActionIfModelDisabled]
    });
