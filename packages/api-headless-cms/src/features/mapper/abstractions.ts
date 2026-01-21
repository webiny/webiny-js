import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryListWhere, CmsModelField } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface ICmsFieldInputToWhereMapperParams<T extends GenericRecord> {
    fields: Pick<CmsModelField, "fieldId">[];
    input: T | undefined;
}

export interface ICmsFieldInputToWhereMapper {
    map<T extends GenericRecord>(
        params: ICmsFieldInputToWhereMapperParams<T>
    ): CmsEntryListWhere | undefined;
}

export const CmsFieldInputToWhereMapper = createAbstraction<ICmsFieldInputToWhereMapper>(
    "CmsFieldInputToWhereMapper"
);

export namespace CmsFieldInputToWhereMapper {
    export type Interface = ICmsFieldInputToWhereMapper;
    export type Params<T extends GenericRecord> = ICmsFieldInputToWhereMapperParams<T>;
}
