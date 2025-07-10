import type { IIngestorResultItem } from "~/resolver/app/ingestor/types.js";
import type { CommandType } from "~/types.js";
import type { ITable } from "~/sync/types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";

export interface IBundleItem {
    PK: string;
    SK: string;
}

export interface IBundle {
    readonly items: IBundleItem[];
    readonly command: CommandType;
    readonly table: ITable;
    readonly source: IDeployment;
    canAdd(item: IIngestorResultItem): boolean;
    add(item: IIngestorResultItem): void;
}

export interface IBundlerBundleParams {
    items: IIngestorResultItem[];
}

export interface IBundler {
    bundle(params: IBundlerBundleParams): IBundles;
}

export interface IBundlesAddParams {
    item: IIngestorResultItem;
}

export interface IBundles {
    add(params: IBundlesAddParams): void;
    getBundles(): IBundle[];
}
