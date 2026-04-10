import { createAbstraction } from "@webiny/feature/api";

export interface IValueFilterMatchesParams<TValue = any, TCompareValue = any> {
    value: TValue;
    compareValue: TCompareValue;
}

export type IValueFilterMatchesResult = boolean;

export interface IValueFilter<TValue = any, TCompareValue = any> {
    readonly operation: string;
    matches(params: IValueFilterMatchesParams<TValue, TCompareValue>): IValueFilterMatchesResult;
}

export const ValueFilter = createAbstraction("Db/DynamoDB/ValueFilter");

export namespace ValueFilter {
    export type Interface<TValue = any, TCompareValue = any> = IValueFilter<TValue, TCompareValue>;
    export type Params = IValueFilterMatchesParams;
    export type Result = IValueFilterMatchesResult;
}
