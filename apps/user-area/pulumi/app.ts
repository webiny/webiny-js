import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
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
        App.crawlDirectory(webContentsRootPath, (filePath: string) => {
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

    static crawlDirectory(dir: string, f: (_: string) => void) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = `${dir}/${file}`;
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                App.crawlDirectory(filePath, f);
            }
            if (stat.isFile()) {
                f(filePath);
            }
        }
    }
}

export default App;
