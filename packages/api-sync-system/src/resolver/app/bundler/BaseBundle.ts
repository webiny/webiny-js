import type { IBundle, IBundleItem } from "~/resolver/app/bundler/types.js";
import { IDeployment } from "~/resolver/deployment/types";
import { ITable } from "~/sync/types";
import { CommandType, type ExtendedCommandType } from "~/types";
import { IIngestorResultItem } from "../ingestor/types";

export interface IBaseBundleParams {
    command: ExtendedCommandType;
    table: ITable;
    source: IDeployment;
}

export abstract class BaseBundle implements IBundle {
    readonly items: IBundleItem[] = [];
    readonly command: CommandType;
    readonly table: ITable;
    readonly source: IDeployment;

    public abstract canAdd(item: IIngestorResultItem): boolean;

    public constructor(params: IBaseBundleParams) {
        this.command = this.getCommand(params.command);
        this.table = params.table;
        this.source = params.source;
    }

    protected getCommand(command: ExtendedCommandType): CommandType {
        return command === "delete" ? "delete" : "put";
    }

    public add(item: IIngestorResultItem): void {
        this.items.push({
            PK: item.PK,
            SK: item.SK
        });
    }
}
