import { CoreOutput, createApiApp } from "@webiny/serverless-cms-aws";
import { ServiceDiscovery } from "../core/ServiceDiscovery";

export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi(app) {
        const Core = app.getModule(CoreOutput);

        app.addResource(ServiceDiscovery, {
            name: "service-manifest",
            config: {
                name: "api",
                bucket: Core.fileManagerBucketId,
                manifest: {
                    cloudfront: {
                        distributionId: app.resources.cloudfront.output.id
                    }
                }
            }
        });
    }
});
