import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryListSort, CmsEntryListWhere, CmsModelField } from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface ICmsSortMapperParams<T extends GenericRecord> {
    fields: Pick<CmsModelField, "fieldId">[];
    input: CmsEntryListSort | undefined;
}

export interface ICmsSortMapper {
    map<T extends GenericRecord>(
        params: ICmsSortMapperParams<T>
    ): CmsEntryListSort | undefined;
}

export const CmsSortMapper = createAbstraction<ICmsSortMapper>(
    "CmsSortMapper"
);

export namespace CmsSortMapper {
    export type Interface = ICmsSortMapper;
    export type Params<T extends GenericRecord> = ICmsSortMapperParams<T>;
}
