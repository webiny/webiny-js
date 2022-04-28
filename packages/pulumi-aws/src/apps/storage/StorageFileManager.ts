import * as aws from "@pulumi/aws";
import { defineAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-sdk";

export type StorageFileManger = PulumiAppModule<typeof StorageFileManger>;
export const StorageFileManger = defineAppModule({
    name: "FileManagerBucket",
    config(app: PulumiApp, params: { protect: boolean }) {
        return app.addResource(aws.s3.Bucket, {
            name: "fm-bucket",
            config: {
                acl: "private",
                // We definitely don't want to force-destroy if "protected" flag is true.
                forceDestroy: !params.protect,
                corsRules: [
                    {
                        allowedHeaders: ["*"],
                        allowedMethods: ["POST", "GET"],
                        allowedOrigins: ["*"],
                        maxAgeSeconds: 3000
                    }
                ]
            },
            opts: {
                protect: params.protect
            }
        });
    }
});
