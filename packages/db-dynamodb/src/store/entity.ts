import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { DynamoDbEntityFactory } from "~/features/DynamoDbEntityFactory/abstractions.js";
import type { IStoreEntity, IStoreEntityValue } from "~/store/types.js";

export interface ICreateEntityParams {
    client: DynamoDbDocumentClient.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
}

export const createEntity = ({ client, entityFactory }: ICreateEntityParams): IStoreEntity => {
    return entityFactory.createGlobal<IStoreEntityValue>({
        client,
        name: "WebinyKeyValue"
    });
};
