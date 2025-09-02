import type zod from "zod";
import type { GenericRecord } from "@webiny/api/types";
import type { DataLoaderRequest } from "./DataLoaderRequest";

export type DataLoaderResult = GenericRecord | GenericRecord[] | undefined;

export interface IDataLoader {
    load(request: DataLoaderRequest): Promise<DataLoaderResult>;
}

export interface IDataSource<TConfig extends GenericRecord = GenericRecord> {
    getType(): string;
    getConfigSchema(): zod.ZodType<TConfig>;
    load(request: DataLoaderRequest<TConfig>): Promise<DataLoaderResult>;
}

export interface IDataSourceContext {
    addDataSource: (dataSource: IDataSource) => void;
    getLoader: () => IDataLoader;
}

export interface DataSourcesContext {
    dataSources: IDataSourceContext;
}

export interface RequestDto {
    type: string;
    config: GenericRecord;
    paths: string[];
}
