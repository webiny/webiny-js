import type { IEntity, IGlobalEntityAttributes } from "~/utils/index.js";

export interface IStoreEntityValue {
    key: string;
    value: string;
}

export type IStoreEntity = IEntity<IGlobalEntityAttributes<IStoreEntityValue>>;
