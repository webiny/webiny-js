import type { GenericRecord } from "@webiny/api/types";

export interface IUniqueResolver<T extends GenericRecord> {
    resolve(assets: T[], field: keyof T): T[];
}
