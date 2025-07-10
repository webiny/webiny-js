/**
 * Used to bundle by source system, table and command.
 * If we receive >1 commands in a single batch, for example, put -> delete -> put -> delete, we need to make sure
 * that commands are executed in that order.
 *
 * This will be used for executing the commands in the target systems.
 */
import type { IBundle } from "./types.js";
import type { IIngestorResultItem } from "../ingestor/types";
import type { IBaseBundleParams } from "./BaseBundle.js";
import { BaseBundle } from "./BaseBundle.js";

export class CommandBundle extends BaseBundle {
    public canAdd(item: IIngestorResultItem): boolean {
        const command = this.getCommand(item.command);
        return (
            this.command === command &&
            this.table.name === item.table.name &&
            this.source.name === item.source.name
        );
    }
}

export const createCommandBundle = (params: IBaseBundleParams): IBundle => {
    return new CommandBundle(params);
};
