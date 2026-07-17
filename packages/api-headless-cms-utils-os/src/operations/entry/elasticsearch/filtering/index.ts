import type { CmsModel, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import type { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter/index.js";
import type { CmsEntryOpenSearchOperatorList } from "~/features/CmsEntryOpenSearchOperatorList/index.js";
import type { CmsEntryOpenSearchValueTransformer } from "~/features/CmsEntryOpenSearchValueTransformer/index.js";
import type { CmsEntryOpenSearchFieldPathFactory } from "~/features/CmsEntryOpenSearchFieldPathFactory/index.js";
import { CmsEntryOpenSearchExecFilteringClass } from "~/features/CmsEntryOpenSearchExecFiltering/CmsEntryOpenSearchExecFilteringImpl.js";

export interface CreateExecParams {
    model: CmsModel;
    fields: ModelFields;
    operatorList: CmsEntryOpenSearchOperatorList.Interface;
    valueTransformer: CmsEntryOpenSearchValueTransformer.Interface;
    fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Interface;
    filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface;
}

export interface IExecParams {
    where: CmsEntryListWhere;
    query: OpenSearchBoolQueryConfig;
    isValues?: boolean;
}

export interface CreateExecFilteringResponse {
    (params: IExecParams): void;
}

export const createExecFiltering = (params: CreateExecParams): CreateExecFilteringResponse => {
    const { model, fields, operatorList, valueTransformer, fieldPathFactory, filterRegistry } =
        params;

    const impl = new CmsEntryOpenSearchExecFilteringClass(
        operatorList,
        valueTransformer,
        fieldPathFactory,
        filterRegistry
    );

    return ({ where, query }) => {
        impl.execute({ model, fields, where, query });
    };
};
