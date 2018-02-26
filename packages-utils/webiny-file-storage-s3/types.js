// s3 config, for additional params check:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
export type S3StorageDriverConfig = {
    // s3 config keys
    bucket: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    endpoint: string,
    // driver config keys
    createDatePrefix: boolean,
    directory: string,
    publicUrl: string
};
