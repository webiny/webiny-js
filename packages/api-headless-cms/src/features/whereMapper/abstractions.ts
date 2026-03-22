import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryListWhere, CmsModelField } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface ICmsWhereMapperParams<T extends GenericRecord> {
    fields: Pick<CmsModelField, "fieldId">[];
    input: T | undefined;
}

export interface ICmsWhereMapper {
    map<T extends GenericRecord>(params: ICmsWhereMapperParams<T>): CmsEntryListWhere | undefined;
}

/** Map CMS filter conditions to storage queries. */
export const CmsWhereMapper = createAbstraction<ICmsWhereMapper>("CmsWhereMapper");

export namespace CmsWhereMapper {
    export type Interface = ICmsWhereMapper;
    export type Params<T extends GenericRecord> = ICmsWhereMapperParams<T>;
}
