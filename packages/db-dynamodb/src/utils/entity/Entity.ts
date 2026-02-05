// @ts-nocheck 123
import type {
    AttributeDefinitions,
    EntityConstructor as BaseEntityConstructor,
    Readonly,
    TableDef
} from "~/toolbox.js";
import { Entity as BaseEntity } from "~/toolbox.js";
import type { ITableWriteBatch } from "../table/types.js";
import type {
    IEntity,
    IEntityCreateEntityReaderParams,
    IEntityCreateEntityWriterParams,
    IEntityDeleteResult,
    IEntityGetCleanResult,
    IEntityGetResult,
    IEntityPutResult,
    IEntityQueryAllCleanResult,
    IEntityQueryAllParams,
    IEntityQueryAllResult,
    IEntityQueryOneCleanResult,
    IEntityQueryOneParams,
    IEntityQueryOneResult,
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
> = BaseEntityConstructor<
    TableDef,
    string,
    true,
    true,
    true,
    "created",
    "modified",
    "entity",
    false,
    T
>;

export class Entity<T extends GenericRecord = GenericRecord> implements IEntity<T> {
    public readonly entity: BaseEntity;

    public get name(): string {
        return this.entity.name;
    }

    public get table(): TableDef {
        /**
         * Not possible to be undefined.
         */
        return this.entity.table!;
    }

    public constructor(params: EntityConstructor) {
        this.entity = new BaseEntity(params);
    }

    public createEntityReader(params?: IEntityCreateEntityReaderParams): IEntityReadBatch<T> {
        return createEntityReadBatch({
            entity: this.entity,
            read: params?.read
        });
    }

    public createEntityWriter(params?: IEntityCreateEntityWriterParams): IEntityWriteBatch<T> {
        return createEntityWriteBatch({
            entity: this.entity,
            put: params?.put,
            delete: params?.delete
        });
    }

    public createTableWriter(): ITableWriteBatch {
        return createTableWriteBatch({
            table: this.entity.table as TableDef
        });
    }

    public async put<T extends GenericRecord = GenericRecord>(
        item: IPutParamsItem<T>
    ): IEntityPutResult {
        return put({
            entity: this.entity,
            item
        });
    }

    public async get<T>(keys: GetRecordParamsKeys): IEntityGetResult<T> {
        return get<T>({
            entity: this.entity,
            keys
        });
    }

    public async getClean<T>(keys: GetRecordParamsKeys): IEntityGetCleanResult<T> {
        return getClean<T>({
            entity: this.entity,
            keys
        });
    }

    public async delete(keys: IDeleteItemKeys): IEntityDeleteResult {
        return deleteItem({
            entity: this.entity,
            keys
        });
    }

    public async queryOne<T>(params: IEntityQueryOneParams): IEntityQueryOneResult<T> {
        return queryOne<T>({
            ...params,
            entity: this.entity
        });
    }

    public async queryOneClean<T>(params: IEntityQueryOneParams): IEntityQueryOneCleanResult<T> {
        return queryOneClean<T>({
            ...params,
            entity: this.entity
        });
    }

    public async queryAll<T>(params: IEntityQueryAllParams): IEntityQueryAllResult<T> {
        return queryAll<T>({
            ...params,
            entity: this.entity
        });
    }

    public async queryAllClean<T>(params: IEntityQueryAllParams): IEntityQueryAllCleanResult<T> {
        return queryAllClean<T>({
            ...params,
            entity: this.entity
        });
    }

    public async queryPerPage<T>(params: IEntityQueryPerPageParams) {
        return queryPerPage<T>({
            ...params,
            entity: this.entity
        });
    }
}

export const createEntity = <T extends GenericRecord = GenericRecord>(
    params: EntityConstructor
): IEntity<T> => {
    return new Entity<T>(params);
};
