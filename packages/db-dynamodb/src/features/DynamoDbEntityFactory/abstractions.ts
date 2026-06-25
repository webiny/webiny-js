import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { AttributeDefinitions } from "~/utils/EntitySchema.js";
import type { IEntity } from "~/utils/entity/types.js";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { IGlobalEntityAttributes } from "./attributes.js";
import type { IStandardEntityAttributes } from "./attributes.js";

export {
    globalEntityAttributes,
    standardEntityAttributes,
    type IGlobalEntityAttributes,
    type IStandardEntityAttributes
} from "./attributes.js";

export interface IDynamoDbEntityFactoryCreateParams {
    name: string;
    attributes: AttributeDefinitions;
    client: DynamoDbDocumentClient.Interface;
    timestamps?: boolean;
}

export interface IDynamoDbEntityFactoryCreateStandardParams {
    name: string;
    client: DynamoDbDocumentClient.Interface;
    attributes?: AttributeDefinitions;
    timestamps?: boolean;
}

export interface IDynamoDbEntityFactoryCreateGlobalParams {
    name: string;
    client: DynamoDbDocumentClient.Interface;
    attributes?: AttributeDefinitions;
    timestamps?: boolean;
}

export interface IDynamoDbEntityFactory {
    create<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateParams
    ): IEntity<T>;

    createStandard<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateStandardParams
    ): IEntity<IStandardEntityAttributes<T>>;

    createGlobal<T extends GenericRecord = GenericRecord>(
        params: IDynamoDbEntityFactoryCreateGlobalParams
    ): IEntity<IGlobalEntityAttributes<T>>;
}

export const DynamoDbEntityFactory = createAbstraction<IDynamoDbEntityFactory>(
    "Db/DynamoDB/DynamoDbEntityFactory"
);

export namespace DynamoDbEntityFactory {
    export type Interface = IDynamoDbEntityFactory;
}
