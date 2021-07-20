import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { assignFields } from "./assignFields";

export interface TransformParams {
    value: any;
}
export interface Transform {
    (params: TransformParams): any;
}
export interface CanTransform {
    (field: string): boolean;
}
export interface Params {
    fields: string[];
    transform: Transform;
    canTransform?: CanTransform;
}

export class ValueTransformPlugin extends Plugin {
    public static readonly type = "dynamodb.value.transform";

    private readonly _params: Params;

    public constructor(params: Params) {
        super();
        this._params = {
            ...params,
            fields: assignFields(params.fields)
        };
    }

    public canTransform(field: string): boolean {
        if (!this._params.canTransform) {
            return this._params.fields.includes(field);
        }
        return this._params.canTransform(field);
    }

    public transform(params: TransformParams): any {
        if (!this._params.transform) {
            throw new WebinyError(`Missing "transform" in the plugin.`, "TRANSFORM_ERROR", {
                fields: this._params.fields
            });
        }
        return this._params.transform(params);
    }
}
