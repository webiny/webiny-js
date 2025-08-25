import type { IStorageListErrorResult } from "~/storage/abstractions/Storage.js";

export interface IListErrorResultParams {
    error: Error;
}

export class ListErrorResult implements IStorageListErrorResult {
    public readonly error: Error;
    public readonly success = false;

    private constructor(params: IListErrorResultParams) {
        this.error = params.error;
    }

    public static create(params: IListErrorResultParams): IStorageListErrorResult {
        return new ListErrorResult(params);
    }
}
