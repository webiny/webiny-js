import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi-sdk";

export function createEventBus(app: PulumiApp) {
    return app.addResource(aws.cloudwatch.EventBus, {
        name: "event-bus",
        config: {}
    });
}
