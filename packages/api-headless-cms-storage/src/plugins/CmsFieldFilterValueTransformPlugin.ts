import { Plugin } from "@webiny/plugins";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { Plugin as IPlugin } from "@webiny/plugins/types.js";

export interface CmsFieldFilterValueTransformParams {
    /* A field which value we are transforming. */
    field: Partial<CmsModelField> &
        Pick<CmsModelField, "id" | "storageId" | "fieldId" | "settings">;
    value: any;
}

export interface ICmsFieldFilterValueTransformPlugin extends IPlugin {
    /* A plugin type. */
    type: "cms-field-filter-value-transform";
    /* A field type this plugin is for. */
    fieldType: string;
    /* Transform method which expect field definition and value to transform. */
    transform: (params: CmsFieldFilterValueTransformParams) => any;
}

type CmsFieldFilterValueTransformPluginParams = Omit<ICmsFieldFilterValueTransformPlugin, "type">;

export class CmsFieldFilterValueTransformPlugin
    extends Plugin
    implements Omit<ICmsFieldFilterValueTransformPlugin, "type">
{
    public static override type = "cms-field-filter-value-transform";

    private readonly config: CmsFieldFilterValueTransformPluginParams;

    public get fieldType(): string {
        return this.config.fieldType;
    }

    public get transform(): CmsFieldFilterValueTransformPluginParams["transform"] {
        return this.config.transform;
    }

    public constructor(config: CmsFieldFilterValueTransformPluginParams) {
        super();
        this.config = config;
    }
}
