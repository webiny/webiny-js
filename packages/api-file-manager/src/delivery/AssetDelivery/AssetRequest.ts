import type { GenericRecord } from "@webiny/api/types.js";

export interface AssetRequestOptions {
    original?: boolean;
    width?: number;
}

export type AssetRequestContext<T extends GenericRecord = GenericRecord> = T & {
    /**
     * Asset request URL.
     */
    url: string;
};

export interface AssetRequestData<TOptions> {
    key: string;
    context: AssetRequestContext;
    options: TOptions;
}
export class AssetRequest<TOptions extends AssetRequestOptions = AssetRequestOptions> {
    private readonly data: AssetRequestData<TOptions>;

    public static create<TOptions extends AssetRequestOptions = AssetRequestOptions>(
        data: AssetRequestData<TOptions>
    ) {
        return new AssetRequest(data);
    }

    private constructor(data: AssetRequestData<TOptions>) {
        this.data = data;
    }

    public getKey() {
        return this.data.key;
    }

    public getOptions(): TOptions {
        return this.data.options;
    }

    public setOptions(options: TOptions) {
        this.data.options = options;
    }

    public getContext<T extends GenericRecord = GenericRecord>() {
        return this.data.context as AssetRequestContext<T>;
    }

    public getExtension() {
        return this.data.key.split(".").pop();
    }
}
