# Quick Example

The following example shows how to create a simple Pulumi app that deploys a single Amazon S3 bucket. We then use the app in our Pulumi program's entrypoint file (`index.ts`) and also adjust a couple of resource config values.  

```ts
// Defining the app.
import * as aws from "@pulumi/aws";
import { createPulumiApp } from "@webiny/pulumi";

export interface CreateMyAppParams {
    pulumi?: (app: ReturnType<typeof createMyApp>) => void;
}

const createMyApp = (projectAppConfig: CreateMyAppParams) => {
    const app = createPulumiApp({
        name: "my-app",
        path: "relative/path/from/cwd",
        program: async app => {
            const bucket = app.addResource(aws.s3.Bucket, {
                name: "my-app",
                config: {
                    acl: aws.s3.CannedAcl.PublicRead,
                    forceDestroy: false,
                    website: {
                        indexDocument: "index.html",
                        errorDocument: "index.html"
                    }
                }
            });

            app.addOutputs({
                appStorage: bucket.output.id
            });

            return {
                bucket
            };
        }
    });

    if (projectAppConfig.pulumi) {
        projectAppConfig.pulumi(app);
    }

    return app;
};
```

Once we have our Pulumi app defined, we can use it in our Pulumi program's entrypoint file (`index.ts`),

```ts
// Using the app and overriding cloud infrastructure settings.
// This is imported in our Pulumi program's entrypoint file (index.ts).
import createMyApp from "./my-dir/createMyApp";

export = async () => {
    const myApp = createMyApp({
        pulumi: app => {
            // Let's update `acl` and `forceDestroy` config values.
            app.resources.bucket.config.acl(aws.s3.CannedAcl.Private);
            app.resources.bucket.config.forceDestroy(true);
        }
    });

    return myApp.run();
};

```
