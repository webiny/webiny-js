import { Plugin } from "@webiny/plugins";
import { Field } from "~/operations/entry/filtering/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

interface CmsEntryFieldSortingPluginCanUseParams {
    model: CmsModel;
    field?: Field;
    fieldId: string;
    order: "ASC" | "DESC";
    /**
     * Combination of fieldId and sortBy
     *
     * example: id_ASC or createdBy_DESC
     */
    sortBy: string;
}

interface CmsEntryFieldSortingPluginCreateSortParams {
    model: CmsModel;
    fieldId: string;
    order: "ASC" | "DESC";
    sortBy: string;
    fields: Record<string, Field>;
    field?: Field;
}

interface CmsEntryFieldSortingPluginCreateSortResult {
    valuePath: string;
    reverse: boolean;
    fieldId: string;
    field: Field;
}

interface CmsEntryFieldSortingPluginConfig {
    createSort: (
        params: CmsEntryFieldSortingPluginCreateSortParams
    ) => CmsEntryFieldSortingPluginCreateSortResult;
    canUse: (params: CmsEntryFieldSortingPluginCanUseParams) => boolean;
}

export class CmsEntryFieldSortingPlugin extends Plugin {
    public static override readonly type: string = "cms.entry.field.sorting";
    private readonly config: CmsEntryFieldSortingPluginConfig;

    public constructor(config: CmsEntryFieldSortingPluginConfig) {
        super();
        this.config = config;
    }

    public canUse(params: CmsEntryFieldSortingPluginCanUseParams): boolean {
        return this.config.canUse(params);
    }

    public createSort(
        params: CmsEntryFieldSortingPluginCreateSortParams
    ): CmsEntryFieldSortingPluginCreateSortResult {
        return this.config.createSort(params);
    }
}

export const createCmsEntryFieldSortingPlugin = (config: CmsEntryFieldSortingPluginConfig) => {
    return new CmsEntryFieldSortingPlugin(config);
};
