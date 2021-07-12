import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";

export interface MatchesParams {
    value: any;
    compareValue: any;
}

export interface Matches {
    (params: MatchesParams): boolean;
}

export interface Params {
    operation: string;
    matches: Matches;
}
export class ValueFilterPlugin extends Plugin {
    public static readonly type = "dynamodb.value.filter";
    private readonly _params: Params;

    public get operation(): string {
        return this.getOperation();
    }

    public constructor(params: Params) {
        super();
        this._params = params;
    }

    public matches(params: MatchesParams): boolean {
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
