import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { assignFields } from "./assignFields";

export interface CreatePath {
    (field: string): string;
}
export interface FieldPathPluginParams {
    /**
     * Which field(s) is this plugin for.
     */
    fields: string | string[];
    /**
     * Create a path for given field.
     * Field is passed because it can be a multi-field plugin.
     */
    createPath: CreatePath;
}

export class FieldPathPlugin extends Plugin {
    public static override readonly type: string = "dynamodb.value.path";
    private readonly _params: Omit<FieldPathPluginParams, "fields"> & { fields: string[] };

    public constructor(params: FieldPathPluginParams) {
        super();
        this._params = {
            ...params,
            fields: assignFields(params.fields)
        };
    }

    public canCreate(field: string): boolean {
        return this._params.fields.includes(field);
    }

    public createPath(field: string): string {
        if (!this._params.createPath) {
            throw new WebinyError(`Missing "createPath" in the plugin.`, "TRANSFORM_ERROR", {
                fields: this._params.fields
            });
        }
        return this._params.createPath(field);
    }
}
