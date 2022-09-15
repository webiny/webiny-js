import {
    CmsModelFieldConverterPlugin,
    ConvertParams
} from "~/plugins/CmsModelFieldConverterPlugin";

export class CmsModelDefaultFieldConverterPlugin extends CmsModelFieldConverterPlugin {
    public override name = "cms.field.converter.default";

    public override getFieldType(): string {
        return "*";
    }

    public override convertToStorage({ field, value }: ConvertParams): any {
        /**
         * A single and multiple values field conversion;
         */
        return {
            [field.storageId]: value
        };
    }

    public override convertFromStorage({ field, value }: ConvertParams): any {
        /**
         * A single and multiple values field conversion;
         */
        return {
            [field.fieldId]: value
        };
    }
}
