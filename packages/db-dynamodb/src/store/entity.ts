import type { ITable } from "~/utils/index.js";
import { createGlobalEntity as baseCreateGlobalEntity } from "~/utils/index.js";
import type { IStoreEntity, IStoreEntityValue } from "~/store/types.js";

export interface ICreateEntityParams {
    table: ITable;
}

export const createEntity = ({ table }: ICreateEntityParams): IStoreEntity => {
    return baseCreateGlobalEntity<IStoreEntityValue>({
        table: table.table,
        name: "WebinyKeyValue"
    });
};
