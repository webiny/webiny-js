import type {
    AttributeDefinitions,
    EntityConstructor as BaseEntityConstructor,
    Readonly
} from "~/toolbox.js";
import { EntitySchema } from "~/utils/EntitySchema.js";
import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { ITableWriteBatch } from "../table/types.js";
import type {
    IEntity,
    IEntityCreateEntityReaderParams,
    IEntityCreateEntityWriterParams,
    IEntityQueryAllParams,
    IEntityQueryOneParams,
    IEntityQueryPerPageParams,
    IEntityReadBatch,
    IEntityWriteBatch
} from "./types.js";
import type { IPutParamsItem } from "../put.js";
import { put } from "../put.js";
import type { GetRecordParamsKeys } from "../get.js";
import { get, getClean } from "../get.js";
import type { IDeleteItemKeys } from "../delete.js";
import { deleteItem } from "../delete.js";
import { createEntityReadBatch } from "./EntityReadBatch.js";
import { createEntityWriteBatch } from "./EntityWriteBatch.js";
import { createTableWriteBatch } from "~/utils/table/TableWriteBatch.js";
import { queryAll, queryAllClean, queryOne, queryOneClean, queryPerPage } from "../query.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type EntityConstructor<
    T extends Readonly<AttributeDefinitions> = Readonly<AttributeDefinitions>
> = BaseEntityConstructor<T>;

export class Entity<T extends GenericRecord = GenericRecord> implements IEntity<T> {
    public readonly schema: EntitySchema;
    public readonly client: DynamoDocClient;

    public get name(): string {
        return this.schema.name;
    }

    public constructor(params: EntityConstructor) {
        this.schema = new EntitySchema({
            name: params.name,
            attributes: params.attributes as AttributeDefinitions,
            timestamps: params.timestamps
        });

        if (!params.table) {
            throw new Error(`No table provided for entity "${params.name}".`);
        }

        this.client = params.table;
    }

    public createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch<T> {
        return createEntityReadBatch({
            schema: this.schema,
            client: this.client,
            read: params?.read
        });
    }

    public createEntityWriter(params?: IEntityCreateEntityWriterParams): IEntityWriteBatch<T> {
        return createEntityWriteBatch({
            schema: this.schema,
            client: this.client,
            put: params?.put,
            delete: params?.delete
        });
    }

    public createTableWriter(): ITableWriteBatch {
        return createTableWriteBatch({
            table: this.client
        });
    }

    public async put<T extends GenericRecord = GenericRecord>(
        item: IPutParamsItem<T>
    ): Promise<void> {
        return put({
            client: this.client,
            schema: this.schema,
            item
        });
    }

    public async get<T>(keys: GetRecordParamsKeys): Promise<T | null> {
        return get<T>({
            client: this.client,
            schema: this.schema,
            keys
        });
    }

    public async getClean<T>(keys: GetRecordParamsKeys): Promise<T | null> {
        return getClean<T>({
            client: this.client,
            schema: this.schema,
            keys
        });
    }

    public async delete(keys: IDeleteItemKeys): Promise<void> {
        return deleteItem({
            client: this.client,
            keys
        });
    }

    public async queryOne<T>(params: IEntityQueryOneParams): Promise<T | null> {
        return queryOne<T>({
            ...params,
            client: this.client,
            schema: this.schema
        });
    }

    public async queryOneClean<T>(params: IEntityQueryOneParams): Promise<T | null> {
        return queryOneClean<T>({
            ...params,
            client: this.client,
            schema: this.schema
        });
    }

    public async queryAll<T>(params: IEntityQueryAllParams): Promise<T[]> {
        return queryAll<T>({
            ...params,
            client: this.client,
            schema: this.schema
        });
    }

    public async queryAllClean<T>(params: IEntityQueryAllParams): Promise<T[]> {
        return queryAllClean<T>({
            ...params,
            client: this.client,
            schema: this.schema
        });
    }

    public async queryPerPage<T>(params: IEntityQueryPerPageParams) {
        return queryPerPage<T>({
            ...params,
            client: this.client,
            schema: this.schema
        });
    }
}

export const createEntity = <T extends GenericRecord = GenericRecord>(
    params: EntityConstructor
): IEntity<T> => {
    return new Entity<T>(params);
};
