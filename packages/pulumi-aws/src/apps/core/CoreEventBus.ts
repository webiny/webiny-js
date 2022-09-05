import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp } from "@webiny/pulumi";

export const CoreEventBus = createAppModule({
    name: "CoreEventBus",
    config(app: PulumiApp) {
        return app.addResource(aws.cloudwatch.EventBus, {
            name: "event-bus",
            config: {}
        });
    }
});
