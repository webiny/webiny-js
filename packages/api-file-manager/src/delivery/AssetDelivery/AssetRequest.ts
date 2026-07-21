import type { GenericRecord } from "@webiny/api/types.js";
import type { ImageFormat } from "~/features/assetDelivery/transformation/imageFormat.js";

export interface AssetRequestOptions {
    original?: boolean;
    width?: number;
    /** Encoder quality (1–100). */
    quality?: number;
    /** Concrete output format (already resolved from any "auto" request). */
    format?: ImageFormat;
    /**
     * Per-request crop (normalized 0–1 edge insets). When present it is baked into
     * the delivered image, superseding the file's asset-level crop — so a per-usage
     * crop can produce its own server-cropped, cacheable URL. Parsed from `?crop=`.
     */
    crop?: { top: number; left: number; bottom: number; right: number };
    /**
     * Target aspect ratio (`width / height`). The delivery frames the largest region
     * of that ratio inside the crop, centered on the focal point. Parsed from
     * `?aspectRatio=` (accepts `16:9` or a decimal).
     */
    aspectRatio?: number;
    /**
     * Normalized 0–1 focal point kept in frame when `aspectRatio` forces extra
     * cutting. Parsed from `?focal=x,y`.
     */
    focal?: { x: number; y: number };
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
