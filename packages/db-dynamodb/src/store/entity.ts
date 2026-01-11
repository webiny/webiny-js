import type { Table } from "~/utils/index.js";
import { createGlobalEntity as baseCreateEntity, globalEntityAttributes } from "~/utils/index.js";
import type { IStoreEntity, IStoreEntityValue } from "~/store/types.js";

export interface ICreateEntityParams {
    table: Table;
}

export const createEntity = ({ table }: ICreateEntityParams): IStoreEntity => {
    return baseCreateEntity<IStoreEntityValue>({
        table,
        name: "WebinyKeyValue",
        attributes: {
            ...globalEntityAttributes
        }
    });
};
