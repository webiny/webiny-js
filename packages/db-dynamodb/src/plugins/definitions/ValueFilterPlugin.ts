import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";

export interface ValueFilterPluginParamsMatchesParams<V = any, C = any> {
    value: V;
    compareValue: C;
}

export interface ValueFilterPluginParamsMatches {
    (params: ValueFilterPluginParamsMatchesParams): boolean;
}

export interface ValueFilterPluginParams {
    operation: string;
    canUse?: (params: ValueFilterPluginParamsMatchesParams) => boolean;
    matches: ValueFilterPluginParamsMatches;
}
export class ValueFilterPlugin<V = any, C = any> extends Plugin {
    public static override readonly type: string = "dynamodb.value.filter";
    private readonly _params: ValueFilterPluginParams;

    public get operation(): string {
        return this.getOperation();
    }

    public constructor(params: ValueFilterPluginParams) {
        super();
        this._params = params;
    }

    public canUse(params: ValueFilterPluginParamsMatchesParams<V, C>): boolean {
        if (!this._params.canUse) {
            return true;
        }
        return this._params.canUse(params);
    }

    public matches(params: ValueFilterPluginParamsMatchesParams): boolean {
        if (!this._params || !this._params.matches) {
            throw new WebinyError(`Missing "matches" in the plugin.`, "MATCHES_ERROR", {
                plugin: this,
                params
            });
        }
        return this._params.matches(params);
    }

    public getOperation(): string {
        if (!this._params || !this._params.operation) {
            throw new WebinyError(`Missing "operation" in the plugin.`, "OPERATION_ERROR");
        }
        return this._params.operation;
    }
}
