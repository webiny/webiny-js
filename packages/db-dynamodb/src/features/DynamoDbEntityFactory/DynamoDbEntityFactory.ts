import { Entity } from "~/utils/entity/Entity.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IEntity } from "~/utils/entity/types.js";
import type { DynamoDbBatchFactory } from "~/features/DynamoDbBatchFactory/abstractions.js";
import type { IDynamoDbEntityFactory } from "./abstractions.js";
import type { IDynamoDbEntityFactoryCreateParams } from "./abstractions.js";
import type { IDynamoDbEntityFactoryCreateStandardParams } from "./abstractions.js";
import type { IDynamoDbEntityFactoryCreateGlobalParams } from "./abstractions.js";
import type { IGlobalEntityAttributes } from "./attributes.js";
import type { IStandardEntityAttributes } from "./attributes.js";
import { globalEntityAttributes } from "./attributes.js";
import { standardEntityAttributes } from "./attributes.js";

/* Type errors on the batchFactory constructor param are expected until Task 5 updates Entity. */
export class DynamoDbEntityFactoryImpl implements IDynamoDbEntityFactory {
    public constructor(private readonly batchFactory: DynamoDbBatchFactory.Interface) {}

    public create<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateParams
    ): IEntity<T> {
        return new Entity<T>(
            {
                name: params.name,
                attributes: params.attributes,
                // @ts-expect-error — will be fixed in Task 5 when Entity accepts DynamoDbDocumentClient.Interface
                table: params.client,
                timestamps: params.timestamps
            },
            // @ts-expect-error — will be fixed in Task 5 when Entity constructor accepts batchFactory
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
