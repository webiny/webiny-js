import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { assignFields } from "./assignFields.js";

export interface ValueTransformPluginParamsTransformParams {
    value: Date | string | null | undefined;
}
export interface ValueTransformPluginParamsTransform {
    (params: ValueTransformPluginParamsTransformParams): any;
}
export interface ValueTransformPluginParams {
    fields: string[];
    transform: ValueTransformPluginParamsTransform;
}

export abstract class ValueTransformPlugin extends Plugin {
    public static override readonly type: string = "dynamodb.value.transform";

    private readonly _params: ValueTransformPluginParams;

    public constructor(params: ValueTransformPluginParams) {
        super();
        this._params = {
            ...params,
            fields: assignFields(params.fields)
        };
    }

    public transform(params: ValueTransformPluginParamsTransformParams): any {
        if (!this._params.transform) {
            throw new WebinyError(`Missing "transform" in the plugin.`, "TRANSFORM_ERROR", {
                fields: this._params.fields
            });
        }
        return this._params.transform(params);
    }
}
