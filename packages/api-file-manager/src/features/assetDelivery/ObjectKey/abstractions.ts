import { createAbstraction } from "@webiny/feature/api";

export interface IObjectKeyInstance {
    id(): string;
    relativeKey(): string;
}

export interface IObjectKey {
    from(key: string): IObjectKeyInstance;
}

export const ObjectKey = createAbstraction<IObjectKey>("AssetDelivery/ObjectKey");

export namespace ObjectKey {
    export type Interface = IObjectKey;
    export type Instance = IObjectKeyInstance;
}
