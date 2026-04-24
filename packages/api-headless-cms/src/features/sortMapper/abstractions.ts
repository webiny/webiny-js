import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryListSort, CmsModelField } from "~/types/index.js";

export interface ICmsSortMapperParams {
    fields: Pick<CmsModelField, "fieldId">[];
    input: CmsEntryListSort | undefined;
}

export interface ICmsSortMapper {
    map(params: ICmsSortMapperParams): CmsEntryListSort | undefined;
}

/** Map CMS sort parameters to storage queries. */
export const CmsSortMapper = createAbstraction<ICmsSortMapper>("CmsSortMapper");

export namespace CmsSortMapper {
    export type Interface = ICmsSortMapper;
    export type Params = ICmsSortMapperParams;
}
