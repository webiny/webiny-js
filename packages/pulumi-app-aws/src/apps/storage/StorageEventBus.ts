import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp } from "@webiny/pulumi-app";

export const StorageEventBus = createAppModule({
    name: "StorageEventBus",
    config(app: PulumiApp) {
        return app.addResource(aws.cloudwatch.EventBus, {
            name: "event-bus",
            config: {}
        });
    }
});
