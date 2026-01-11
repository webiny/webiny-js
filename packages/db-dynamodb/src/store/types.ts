import type { IEntity, IStandardEntityAttributes } from "~/utils/index.js";

export interface IStoreEntityValue {
    key: string;
    value: string;
}

export type IStoreEntity = IEntity<IStandardEntityAttributes<IStoreEntityValue>>;
