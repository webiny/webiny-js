/**
 * TODO determine if GSIs are needed
 */
import { createEntity as baseCreateEntity } from "~/utils/entity/index.js";
import {
    type IStandardEntityAttributes,
    standardEntityAttributes,
    type Table
} from "~/utils/index.js";
import type { IStoreEntity, IStoreEntityValue } from "~/store/types.js";

export interface ICreateEntityParams {
    table: Table;
}

export const createEntity = ({ table }: ICreateEntityParams): IStoreEntity => {
    return baseCreateEntity<IStandardEntityAttributes<IStoreEntityValue>>({
        table,
        name: "WebinyKeyValue",
        attributes: {
            ...standardEntityAttributes
        }
    });
};
