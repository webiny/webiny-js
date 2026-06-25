import { Entity } from "~/utils/entity/Entity.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IEntity } from "~/utils/entity/types.js";
import type { DynamoDbBatchFactory } from "~/features/DynamoDbBatchFactory/abstractions.js";
import type { IDynamoDbEntityFactory } from "./abstractions.js";
import type { IDynamoDbEntityFactoryCreateParams } from "./abstractions.js";
import type { IDynamoDbEntityFactoryCreateStandardParams } from "./abstractions.js";
import type { IDynamoDbEntityFactoryCreateGlobalParams } from "./abstractions.js";
import type { IGlobalEntityAttributes } from "./abstractions.js";
import type { IStandardEntityAttributes } from "./abstractions.js";
import { globalEntityAttributes } from "./attributes.js";
import { standardEntityAttributes } from "./attributes.js";

export class DynamoDbEntityFactoryImpl implements IDynamoDbEntityFactory {
    public constructor(private readonly batchFactory: DynamoDbBatchFactory.Interface) {}

    public create<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateParams
    ): IEntity<T> {
        return new Entity<T>(
            {
                name: params.name,
                attributes: params.attributes,
                table: params.client,
                timestamps: params.timestamps
            },
            this.batchFactory
        );
    }

    public createStandard<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateStandardParams
    ): IEntity<IStandardEntityAttributes<T>> {
        return this.create({
            ...params,
            attributes: { ...standardEntityAttributes, ...params.attributes }
        });
    }

    public createGlobal<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateGlobalParams
    ): IEntity<IGlobalEntityAttributes<T>> {
        return this.create({
            ...params,
            attributes: { ...globalEntityAttributes, ...params.attributes }
        });
    }
}
