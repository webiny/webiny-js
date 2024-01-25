import { S3AssetResolver } from "./s3/S3AssetResolver";
import { S3AssetMetadataReader } from "./s3/S3AssetMetadataReader";
import { S3OutputStrategy } from "./s3/S3OutputStrategy";
import { S3ContentsReader } from "./s3/S3ContentsReader";
import { S3ErrorAssetReply } from "./s3/S3ErrorAssetReply";
import { S3RedirectAssetReply } from "./s3/S3RedirectAssetReply";
import { S3StreamAssetReply } from "./s3/S3StreamAssetReply";
import { SharpTransform } from "./s3/SharpTransform";
import { CallableContentsReader } from "./s3/transformation/CallableContentsReader";

export { createCustomAssetDelivery } from "./createCustomAssetDelivery";

export const AssetDelivery = {
    S3AssetResolver,
    S3AssetMetadataReader,
    S3OutputStrategy,
    S3ContentsReader,
    S3ErrorAssetReply,
    S3RedirectAssetReply,
    S3StreamAssetReply,
    SharpTransform,
    CallableContentsReader
};
