import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { createSyncResourceName } from "./createSyncResourceName.js";
import type { EventBusArgs } from "@pulumi/aws/cloudwatch/eventBus.js";
import { SyncSystemSQS } from "~/apps/syncSystem/SyncSystemSQS.js";
import type { EventRuleArgs } from "@pulumi/aws/cloudwatch/eventRule.js";
import type { EventTargetArgs } from "@pulumi/aws/cloudwatch/eventTarget.js";

export const SyncSystemEventBus = createAppModule({
    name: "SyncSystemEventBus",
    config: (app: PulumiApp) => {
        const { sqsQueue } = app.getModule(SyncSystemSQS);

        const eventBusName = createSyncResourceName("eventBus");

        const config: EventBusArgs = {
            name: eventBusName,
            description: "Connect deployed systems to Sync SQS"
        };
        const eventBus = app.addResource(aws.cloudwatch.EventBus, {
            name: eventBusName,
            config
        });

        const eventBusRuleConfig: EventRuleArgs = {
            eventBusName: eventBus.output.name,
            eventPattern: JSON.stringify({
                "detail-type": ["synchronization-input"]
            })
        };

        const eventBusRule = app.addResource(aws.cloudwatch.EventRule, {
            name: createSyncResourceName("eventBusRule"),
            config: eventBusRuleConfig
        });

        const eventBusTargetConfig: EventTargetArgs = {
            rule: eventBusRule.output.name,
            eventBusName: eventBus.output.name,
            arn: sqsQueue.output.arn,
            sqsTarget: {
                messageGroupId: "default"
            }
        };

        const eventBusTarget = app.addResource(aws.cloudwatch.EventTarget, {
            name: createSyncResourceName("eventBusEventTarget"),
            config: eventBusTargetConfig
        });

        const eventBusPolicy = app.addResource(aws.sqs.QueuePolicy, {
            name: createSyncResourceName("queuePolicy"),
            config: {
                queueUrl: sqsQueue.output.url,
                policy: pulumi
                    .all([sqsQueue.output.arn, eventBusRule.output.arn])
                    .apply(([sqsArn, eventBusRuleArn]) => {
                        return JSON.stringify({
                            Version: "2012-10-17",
                            Statement: [
                                {
                                    Effect: "Allow",
                                    Principal: aws.iam.Principals.EventsPrincipal,
                                    Action: ["sqs:SendMessage"],
                                    Resource: [sqsArn, `${sqsArn}/*`],
                                    Condition: {
                                        ArnEquals: {
                                            /**
                                             * Not a mistake, source is the rule, not the bus.
                                             */
                                            "aws:SourceArn": eventBusRuleArn
                                        }
                                    }
                                }
                            ]
                        });
                    })
            }
        });

        return {
            eventBus,
            eventBusRule,
            eventBusTarget,
            eventBusPolicy
        };
    }
});
