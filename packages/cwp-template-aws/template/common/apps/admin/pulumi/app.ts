import { crawlDirectory } from "@webiny/cli-plugin-deploy-pulumi/utils";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as mime from "mime";
import * as path from "path";

class App {
    bucket: aws.s3.Bucket;
    constructor() {
        this.bucket = new aws.s3.Bucket("admin-app", {
            acl: "public-read",
            forceDestroy: true,
            website: {
                indexDocument: "index.html",
                errorDocument: "index.html"
            }
        });

        // Sync the contents of the source directory with the S3 bucket, which will in-turn show up on the CDN.
        const webContentsRootPath = path.join(__dirname, "..", "code", "build");
        crawlDirectory(webContentsRootPath, (filePath: string) => {
            const relativeFilePath = filePath.replace(webContentsRootPath + "/", "");
            new aws.s3.BucketObject(
                relativeFilePath,
                {
                    key: relativeFilePath,
                    acl: "public-read",
                    bucket: this.bucket,
                    contentType: mime.getType(filePath) || undefined,
                    source: new pulumi.asset.FileAsset(filePath),
                    cacheControl: "max-age=31536000"
                },
                {
                    parent: this.bucket
                }
            );
        });
    }
}

export default App;
