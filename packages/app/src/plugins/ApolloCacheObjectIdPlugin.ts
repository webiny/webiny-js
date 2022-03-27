import { Plugin } from "@webiny/plugins";

export interface ApolloCacheObject {
    __typename?: string;
    [key: string]: any;
}

interface ApolloCacheObjectIdPluginCallable<T> {
    (data: T): string | null;
}

export class ApolloCacheObjectIdPlugin<
    T extends ApolloCacheObject = ApolloCacheObject
> extends Plugin {
    public static override readonly type: string = "cache-get-object-id";
    private readonly _getObjectId?: ApolloCacheObjectIdPluginCallable<T>;

    public constructor(getObjectId?: ApolloCacheObjectIdPluginCallable<T>) {
        super();
        this._getObjectId = getObjectId;
    }

    public getObjectId(data: T) {
        if (typeof this._getObjectId !== "function") {
            throw Error(
                `You must provide a "getObjectId" callable to the plugin constructor or extend the ApolloCacheObjectIdPlugin.`
            );
        }

        return this._getObjectId(data);
    }
}
