import * as aws from "@pulumi/aws";

export interface FileManagerStorageOptions {
    /**
     * Don't allow to delete the resource.
     * Useful for production environments to avoid losing data.
     */
    protected: boolean;
}

export class FileManagerStorage {
    bucket: aws.s3.Bucket;

    constructor(options: FileManagerStorageOptions) {
        this.bucket = new aws.s3.Bucket(
            "fm-bucket",
            {
                acl: "private",
                // We definitely don't want to force-destroy if "protected" flag is true.
                forceDestroy: !options.protected,
                corsRules: [
                    {
                        allowedHeaders: ["*"],
                        allowedMethods: ["POST", "GET"],
                        allowedOrigins: ["*"],
                        maxAgeSeconds: 3000
                    }
                ]
            },
            { protect: options.protected }
        );
    }
}
