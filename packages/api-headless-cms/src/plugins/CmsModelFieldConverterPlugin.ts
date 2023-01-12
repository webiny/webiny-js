import { Plugin } from "@webiny/plugins";
import { CmsEntryValues, CmsModelFieldWithParent } from "~/types";
import { ConverterCollection } from "~/utils/converters/ConverterCollection";

export interface ConvertParams<F = CmsModelFieldWithParent> {
    field: F;
    value: any;
    converterCollection: ConverterCollection;
}

export abstract class CmsModelFieldConverterPlugin extends Plugin {
    public static override type = "cms.field.converter";

    public abstract getFieldType(): string;

    public abstract convertToStorage(params: ConvertParams): CmsEntryValues;
    public abstract convertFromStorage(params: ConvertParams): CmsEntryValues;
}
