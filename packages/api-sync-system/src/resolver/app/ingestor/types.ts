import type { CommandType } from "~/types.js";
import type { IResolverSQSRecord } from "~/resolver/app/abstractions/ResolverRecord.js";
import type { IDetailItem } from "~/sync/handler/types.js";
import type { ITable } from "~/sync/types.js";
import { IDeployment } from "~/resolver/deployment/types.js";

export interface IIngestorIngestParams {
    records: IResolverSQSRecord[];
}

export interface IIngestorResultItem {
    PK: string;
    SK: string;
    command: CommandType;
    table: ITable;
    source: IDeployment;
}

export interface IIngestorResultAddParams {
    item: IDetailItem;
    source: IDeployment;
}

export interface IIngestorResult {
    getItems(): IIngestorResultItem[];
    add(params: IIngestorResultAddParams): void;
}

export interface IIngestor {
    ingest(params: IIngestorIngestParams): Promise<IIngestorResult>;
}
