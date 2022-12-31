import { Plugin } from "@webiny/plugins";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { ModelField, ModelFields } from "~/operations/entry/elasticsearch/types";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

interface CmsEntryFilterPluginConfig {
    fieldType: string;
    exec: (params: ExecParams) => void;
}
interface ApplyParams {
    key: string;
    value: any;
    query: ElasticsearchBoolQueryConfig;
    operator: string;
    field: ModelField;
}
export interface ApplyFilteringCb {
    (params: ApplyParams): void;
}

export interface GetFilterPluginCb {
    (type: string): CmsEntryFilterPlugin;
}

interface ExecParams {
    applyFiltering: ApplyFilteringCb;
    getFilterPlugin: GetFilterPluginCb;
    key: string;
    value: any;
    operator: string;
    field: ModelField;
    fields: ModelFields;
    query: ElasticsearchBoolQueryConfig;
}

export interface CmsEntryFilterPluginCreateResponse {
    field: ModelField;
    path: string;
    fieldPathId: string;
    plugin: ValueFilterPlugin;
    negate: boolean;
    compareValue: any;
    transformValue: <I = any, O = any>(value: I) => O;
}

export class CmsEntryFilterPlugin extends Plugin {
    public static override readonly type: string = "cms.elasticsearch.entry.filter";
    public static readonly ALL: string = "*";

    private readonly config: CmsEntryFilterPluginConfig;
    public readonly fieldType: string;

    public constructor(config: CmsEntryFilterPluginConfig) {
        super();
        this.config = config;
        this.fieldType = this.config.fieldType;
    }

    public exec(params: ExecParams) {
        return this.config.exec(params);
    }
}
