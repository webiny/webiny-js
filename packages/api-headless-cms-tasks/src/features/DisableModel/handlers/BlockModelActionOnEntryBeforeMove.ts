import { EntryBeforeMoveEventHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeMoveImpl implements EntryBeforeMoveEventHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeMoveEventHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeMove = EntryBeforeMoveEventHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforeMoveImpl,
    dependencies: [BlockActionIfModelDisabled]
});
