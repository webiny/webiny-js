import { Plugin } from "@webiny/plugins";
import { CmsModelFieldType } from "@webiny/api-headless-cms/types";

/**
 * A plugin which allows you to map a custom GraphQL field to an Elasticsearch field.
 *
 * This is useful when you want to create a custom field in the CMS GraphQL Schema, and you want to map it to an Elasticsearch field.
 */
export interface CmsModelFieldPluginParams {
    /**
     * The type of the field.
     * Can be something custom, like "my-field-type".
     */
    fieldType: CmsModelFieldType;
    /**
     * The ID of the field on the GraphQL side
     */
    fieldId: string;
    /**
     * The path to the field in the Elasticsearch document.
     */
    path: string;
    /**
     * If the field should be applied only to specific models.
     * Or excluded from the specific models.
     *
     * The default is to apply to all models.
     */
    models?: {
        include?: string[];
        exclude?: string[];
    };
    /**
     * The unmapped type of the field.
     * In most cases, this will be undefined.
     * When does it need to be set?
     *
     * When you are using a custom field type, other than the ones that are defined in the CMS.
     * Let's say you create a field of type `my-field-type`, in which you want to store dates. By the default, it will, in most cases be set as string - if you did not specify the value transformer.
     * If you want to be able to sort/filter properly by this field, you need to specify the unmapped type as "date".
     */
    unmappedType?: string;
    /**
     * Is this field searchable?
     * If set to false, an error will be thrown when trying to search/filter by this field.
     */
    searchable?: boolean;
    /**
     * Is this field sortable?
     * If set to false, an error will be thrown when trying to sort by this field.
     */
    sortable?: boolean;
    /**
     * If the .keyword should be applied when doing the filtering or sorting on the field.
     */
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
