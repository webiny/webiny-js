import { createCoreApp } from "@webiny/serverless-cms-aws";
import { ServiceDiscovery } from "./ServiceDiscovery";

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi(app) {
        app.addResource(ServiceDiscovery, {
            name: "service-manifest",
            config: {
                name: "core",
                bucket: app.resources.fileManagerBucket.output.id,
                manifest: {
                    testName: 123,
                    testUrl: "https://webiny.com",
                    bucketId: app.resources.fileManagerBucket.output.id,
                    userPool: {
                        id: app.resources.userPool.output.id,
                        name: app.resources.userPool.output.name,
                        arn: app.resources.userPool.output.arn
                    }
                }
            }
        });
    }
});
