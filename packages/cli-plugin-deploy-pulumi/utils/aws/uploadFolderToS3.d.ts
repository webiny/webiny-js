import { BucketName, ObjectCannedACL, CacheControl } from "aws-sdk/clients/s3";

export interface Paths {
    full: string;
    relative: string;
}

export default function uploadFolderToS3(params: {
    // Path to the folder that needs to be uploaded.
    path: string;

    // A callback that gets called every time a file has been uploaded successfully.
    onFileUploadSuccess: (params: { paths: Paths }) => {};

    // A callback that gets called every time a file has not been uploaded successfully.
    onFileUploadError: (params: { paths: Paths; error: Error }) => {};

    // A callback that gets called every time a file upload has been skipped.
    onFileUploadSkip: (params: { paths: Paths }) => {};

    bucket: BucketName;
    acl: ObjectCannedACL;
    cacheControl: CacheControl;
}): Promise<void>;
