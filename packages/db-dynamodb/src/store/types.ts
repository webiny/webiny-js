import type { IEntity } from "~/utils/index.js";
import type { IGlobalEntityAttributes } from "~/features/DynamoDbEntityFactory/abstractions.js";

export interface IStoreEntityValue {
    key: string;
    value: string;
}

export type IStoreEntity = IEntity<IGlobalEntityAttributes<IStoreEntityValue>>;
