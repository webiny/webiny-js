export type AssetDeliveryParams = {
    imageResizeWidths?: number[];
    /**
     * BE CAREFUL!
     * Setting this to more than 1 hour may cause your URLs to still expire before the desired expiration time.
     * @see https://repost.aws/knowledge-center/presigned-url-s3-bucket-expiration
     */
    presignedUrlTtl?: number;
    assetStreamingMaxSize?: number;
};
