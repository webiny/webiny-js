import * as aws from "@pulumi/aws";
import { defineAppModule, PulumiApp } from "@webiny/pulumi-sdk";

export const StorageEventBus = defineAppModule({
    name: "StorageEventBus",
    config(app: PulumiApp) {
        return app.addResource(aws.cloudwatch.EventBus, {
            name: "event-bus",
            config: {}
        });
    }
});
