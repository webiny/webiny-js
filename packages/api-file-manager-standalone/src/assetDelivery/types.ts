import type { ImageFormat } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";

export type AssetDeliveryParams = {
    imageResizeWidths?: number[];
    /** Per-format encoder quality (1-100). Merged over the built-in defaults. */
    imageQuality?: Partial<Record<ImageFormat, number>>;
    /* presignedUrlTtl is accepted for API compatibility but ignored (local storage always streams). */
    presignedUrlTtl?: number;
    assetStreamingMaxSize?: number;
};
