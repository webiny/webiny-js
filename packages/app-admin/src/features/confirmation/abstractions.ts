import { createAbstraction } from "@webiny/feature/admin";

export interface INamedDialogOpener {
    open(name: string, params: Record<string, unknown>): void;
}

export const NamedDialogOpener = createAbstraction<INamedDialogOpener>("NamedDialogOpener");

export namespace NamedDialogOpener {
    export type Interface = INamedDialogOpener;
}

export interface IConfirmation {
    confirm<TData = void, TParams extends Record<string, unknown> = Record<string, unknown>>(
        name: string,
        params?: TParams
    ): Promise<TData | false>;

    confirm<
        TData = void,
        TParams extends Record<string, unknown> = Record<string, unknown>,
        TResult = unknown
    >(
        name: string,
        params: TParams,
        execute: (data: TData) => Promise<TResult>
    ): Promise<TResult | false>;
}

export const Confirmation = createAbstraction<IConfirmation>("Confirmation");

export namespace Confirmation {
    export type Interface = IConfirmation;
}
