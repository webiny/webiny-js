import { Abstraction } from "@webiny/di";

export type LocalStorageValue = any;

export interface LocalStorageData {
    [key: string]: LocalStorageValue;
}

export interface ILocalStorageService {
    get(): LocalStorageData;

    get(key?: string): LocalStorageValue;

    set(key: string, value: any): LocalStorageData;

    unset(key: string): LocalStorageData;
}

export const LocalStorageService = new Abstraction<ILocalStorageService>("LocalStorageService");

export namespace LocalStorageService {
    export type Interface = ILocalStorageService;

    export type Value = LocalStorageValue;
    export type Data = LocalStorageData;
}
