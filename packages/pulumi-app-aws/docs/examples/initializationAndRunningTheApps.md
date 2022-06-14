# Initialization and Running The Apps

The following examples show how each of the included Pulumi apps are initialized and run.

> 💡 **TIP**
>
> Pulumi apps included in this package are automatically included in every Webiny project that's configured to be deployed into Amazon Web Services (AWS).

## Storage App

```ts
// This is imported in our Pulumi program's entrypoint file (index.ts).
import { createStorageApp } from "@webiny/pulumi-app-aws";

export = async () => {
    const storageApp = createStorageApp({
        pulumi: app => {
            // Let's update `acl` and `forceDestroy` config values.
            app.resources.bucket.config.acl(aws.s3.CannedAcl.Private);
            app.resources.bucket.config.forceDestroy(true);
        }
    });

    return myApp.runProgram();
};

```


Note that the URLs can be overridden with `WCP_APP_URL` and `WCP_API_URL` environment variables.
