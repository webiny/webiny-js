/**
 * CloudFront origin IDs of the API distribution. In a file of their own so that modules which add
 * behaviors later (see `addWebRouteBehavior`) don't have to import `ApiCloudfront`.
 */
export const STREAM_ORIGIN_ID = "graphql-stream-function-url";
export const WEB_ORIGIN_ID = "graphql-web-function-endpoint";
export const FILES_ORIGIN_ID = "fm-download-function-url";
