import { Plugin } from "@webiny/plugins";
import { CmsModelField } from "@webiny/api-headless-cms/types";

export interface CmsModelFieldPluginParams {
    fieldType: CmsModelField["type"];
    fieldId: string;
    path: string;
    models?: {
        include?: string[];
        exclude?: string[];
    };
    unmappedType?: string;
    searchable?: boolean;
    sortable?: boolean;
    keyword?: boolean;
}

export class CmsElasticsearchModelFieldPlugin extends Plugin {
    public static override readonly type: string = "headlessCms.elasticsearch.model.field";

    private readonly field: CmsModelFieldPluginParams;

    public get fieldType() {
        return this.field.fieldType;
    }
    public get fieldId() {
        return this.field.fieldId;
    }
    public get path() {
        return this.field.path;
    }

    public get unmappedType() {
        return this.field.unmappedType;
    }

    public get searchable() {
        return this.field.searchable;
    }

    public get sortable() {
        return this.field.sortable;
    }

    public get keyword() {
        return this.field.keyword;
    }

    public constructor(field: CmsModelFieldPluginParams) {
        super();
        this.field = field;
    }

    public canBeApplied(modelId: string): boolean {
        if (this.field.models?.include?.length) {
            return this.field.models.include.includes(modelId);
        } else if (this.field.models?.exclude?.length) {
            return this.field.models.exclude.includes(modelId) === false;
        }
        return true;
    }
}
