export type AssetDeliveryParams = {
    imageResizeWidths?: number[];
    /* presignedUrlTtl is accepted for API compatibility but ignored (local storage always streams). */
    presignedUrlTtl?: number;
    assetStreamingMaxSize?: number;
};
