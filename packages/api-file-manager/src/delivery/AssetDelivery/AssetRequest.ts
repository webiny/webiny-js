export interface AssetRequestOptions {
    original?: boolean;
    width?: number;
}

export type AssetRequestContext<T extends Record<string, any> = Record<string, any>> = T & {
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
    private data: AssetRequestData<TOptions>;

    constructor(data: AssetRequestData<TOptions>) {
        this.data = data;
    }

    getKey() {
        return this.data.key;
    }

    getOptions(): TOptions {
        return this.data.options;
    }

    setOptions(options: TOptions) {
        this.data.options = options;
    }

    getContext<T>() {
        return this.data.context as AssetRequestContext<T>;
    }

    getExtension() {
        return this.data.key.split(".").pop();
    }
}
