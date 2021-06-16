import { Plugin } from "@webiny/plugins";

export interface Object {
    __typename: string;
    [key: string]: any;
}

interface Callable<T> {
    (data: T): any;
}

export class ApolloCacheObjectIdPlugin<T extends Object = Object> extends Plugin {
    public static readonly type = "cache-get-object-id";
    private _getObjectId: Callable<T>;

    constructor(getObjectId?: Callable<T>) {
        super();
        this._getObjectId = getObjectId;
    }

    getObjectId(data: T) {
        if (typeof this._getObjectId !== "function") {
            throw Error(
                `You must provide a "getObjectId" callable to the plugin constructor or extend the ApolloCacheObjectIdPlugin.`
            );
        }

        return this._getObjectId(data);
    }
}
