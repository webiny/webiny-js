import WebinyError from "@webiny/error";
import { CmsEntryValues, CmsModelField } from "~/types";
import { CmsModelFieldConverterPlugin } from "~/plugins";
import { ConverterCollection } from "./ConverterCollection";

export interface CmsModelFieldWithParent extends CmsModelField {
    parent?: CmsModelFieldWithParent | null;
}

interface ConverterConvertParams {
    field: CmsModelFieldWithParent;
    value: any;
    parent?: CmsModelFieldWithParent | null;
}
export interface ConverterConfig {
    type: string;
    plugin: CmsModelFieldConverterPlugin;
}
export class Converter {
    private readonly type: string;
    private readonly plugin: CmsModelFieldConverterPlugin;

    private converters: ConverterCollection | undefined = undefined;

    public constructor(config: ConverterConfig) {
        this.type = config.type;
        this.plugin = config.plugin;
    }

    public setConverterCollection(converters: ConverterCollection): void {
        if (this.converters) {
            throw new WebinyError(
                `Cannot attach converters collection more than once to Converter with type "${this.type}".`,
                "CONVERTER_COLLECTION_ERROR",
                {
                    type: this.type
                }
            );
        }
        this.converters = converters;
    }

    public getConverterCollection(): ConverterCollection {
        if (!this.converters) {
            throw new WebinyError(
                `There is no ConverterCollection defined in the converter with type "${this.type}".`
            );
        }
        return this.converters;
    }

    public getType(): string {
        return this.type;
    }

    public convertToStorage(params: ConverterConvertParams): CmsEntryValues {
        const { field, value } = params;

        return this.plugin.convertToStorage({
            field,
            value,
            converterCollection: this.getConverterCollection()
        });
    }

    public convertFromStorage(params: ConverterConvertParams): CmsEntryValues {
        const { field, value } = params;

        return this.plugin.convertFromStorage({
            field,
            value,
            converterCollection: this.getConverterCollection()
        });
    }
}
