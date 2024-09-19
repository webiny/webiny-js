import type { GenericRecord } from "@webiny/api/types";
import { UniqueResolver } from "~/tasks/utils/uniqueResolver/UniqueResolver";

export const createUniqueResolver = <T extends GenericRecord>() => {
    return new UniqueResolver<T>();
};
