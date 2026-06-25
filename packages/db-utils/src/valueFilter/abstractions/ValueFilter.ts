import { createAbstraction } from "@webiny/feature/api";

export interface IValueFilterCanUseParams<TValue = any, TCompareValue = any> {
    value: TValue;
    compareValue: TCompareValue;
}

export interface IValueFilterMatchesParams<TValue = any, TCompareValue = any> {
    value: TValue;
    compareValue: TCompareValue;
}

export type IValueFilterMatchesResult = boolean;

export interface IValueFilter<TValue = any, TCompareValue = any> {
    readonly operation: string;
    is(operation: string): boolean;
    canUse(params: IValueFilterCanUseParams): boolean;
    matches(params: IValueFilterMatchesParams<TValue, TCompareValue>): IValueFilterMatchesResult;
}

export const ValueFilter = createAbstraction<IValueFilter>("Db/ValueFilter");

export namespace ValueFilter {
    export type Interface<TValue = any, TCompareValue = any> = IValueFilter<TValue, TCompareValue>;
    export type CanUseParams = IValueFilterCanUseParams;
    export type MatchesParams = IValueFilterMatchesParams;
    export type Result = IValueFilterMatchesResult;
}
