import { ObjectCannedACL, PutObjectCommandInput } from "@webiny/aws-sdk/client-s3";

export interface Paths {
    full: string;
    relative: string;
}

type CacheControlMap = {
    [key: string]: PutObjectCommandInput["CacheControl"]
}

export default function uploadFolderToS3(params: {
    // Path to the folder that needs to be uploaded.
    path: string;

    // A callback that gets called every time a file has been uploaded successfully.
    onFileUploadSuccess: (params: { paths: Paths }) => void;

    // A callback that gets called every time a file has not been uploaded successfully.
    onFileUploadError: (params: { paths: Paths; error: Error }) => void;

    // A callback that gets called every time a file upload has been skipped.
    onFileUploadSkip: (params: { paths: Paths }) => void;

    bucket: PutObjectCommandInput["Bucket"];
    acl?: ObjectCannedACL;
    cacheControl?: PutObjectCommandInput["CacheControl"] | CacheControlMap;
}): Promise<void> ;
