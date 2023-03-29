import { Plugin } from "@webiny/plugins";
import { CmsFieldFilterValueTransformPlugin as CmsFieldFilterValueTransformPluginInterface } from "~/types";

type CmsFieldFilterValueTransformPluginParams = Omit<
    CmsFieldFilterValueTransformPluginInterface,
    "type"
>;
export class CmsFieldFilterValueTransformPlugin
    extends Plugin
    implements Omit<CmsFieldFilterValueTransformPluginInterface, "type">
{
    public static override type = "cms-field-filter-value-transform";

    private config: CmsFieldFilterValueTransformPluginParams;

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
