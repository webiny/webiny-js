import type { Entity, EntityQueryOptions } from "@webiny/db-dynamodb/toolbox";
import type { IStorageListDefaultParams, IStorageListResult } from "./abstractions/IStorage.js";
import { createStartKey } from "./startKey.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import type { IStorageItem } from "~/storage/types.js";
import { ListSuccessResult } from "~/storage/ListSuccessResult.js";
import type { IConverter } from "~/storage/abstractions/IConverter.js";

export interface IStorageListDefaultConstructorParams {
    entity: Entity;
    converter: IConverter;
}

export class StorageListDefault {
    private readonly entity;
    private readonly converter;

    public constructor(params: IStorageListDefaultConstructorParams) {
        this.entity = params.entity;
        this.converter = params.converter;
    }

    public async list(params: IStorageListDefaultParams): Promise<IStorageListResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params)
        };

        const result = await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG`,
            options
        });

        return ListSuccessResult.create({
            data: await this.converter.listFromStorage(
                result.items.map(item => {
                    return item.data;
                })
            ),
            lastEvaluatedKey: result.lastEvaluatedKey
        });
    }
}
