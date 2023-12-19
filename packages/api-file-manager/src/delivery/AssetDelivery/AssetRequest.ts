export interface AssetRequestOptions {
    original?: boolean;
    width?: number;
}

export interface AssetRequestData<TOptions> {
    key: string;
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

    getExtension() {
        return this.data.key.split(".").pop();
    }
}
