import { createAbstraction } from "@webiny/feature/api";
import type { OpenSearchQueryBuilderOperators } from "~/operations/entry/elasticsearch/types.js";

export interface ICmsEntryOpenSearchOperatorList {
    getAll(): OpenSearchQueryBuilderOperators;
}

export const CmsEntryOpenSearchOperatorList = createAbstraction<ICmsEntryOpenSearchOperatorList>(
    "Cms/Entry/OpenSearch/OperatorList"
);

export namespace CmsEntryOpenSearchOperatorList {
    export type Interface = ICmsEntryOpenSearchOperatorList;
}
