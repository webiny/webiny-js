import { EntryBeforeMoveHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.js";
import { BlockActionIfModelDisabled } from "../abstractions.js";

class BlockModelActionOnEntryBeforeMoveImpl implements EntryBeforeMoveHandler.Interface {
    constructor(private blockAction: BlockActionIfModelDisabled.Interface) {}

    async handle(event: EntryBeforeMoveHandler.Event): Promise<void> {
        await this.blockAction.execute(event.payload.model);
    }
}

export const BlockModelActionOnEntryBeforeMove = EntryBeforeMoveHandler.createImplementation({
    implementation: BlockModelActionOnEntryBeforeMoveImpl,
    dependencies: [BlockActionIfModelDisabled]
});
