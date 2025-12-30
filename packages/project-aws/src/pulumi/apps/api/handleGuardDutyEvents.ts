import * as aws from "@pulumi/aws";
import { type ApiPulumiApp, CoreOutput } from "~/pulumi/index.js";

export const handleGuardDutyEvents = (app: ApiPulumiApp) => {
    const core = app.getModule(CoreOutput);
    const graphql = app.resources.graphql.functions.graphql;

    const baseConfig = graphql.config.clone();

    const threatDetectionHandler = app.addResource(aws.lambda.Function, {
        name: "fm-threat-detection",
        config: {
            ...baseConfig,
            memorySize: 1024,
            description: "Handles Guard Duty threat scan results.",
            environment: {
                variables: graphql.output.environment.apply(env => {
                    return {
                        WBY_FUNCTION_TYPE: "threat-detection-event-handler",
                        ...env?.variables
                    };
                })
            }
        }
    });

    const eventRule = app.addResource(aws.cloudwatch.EventRule, {
        name: `fm-bucket-malware-protection-event-rule`,
        config: {
            eventBusName: core.eventBusName,
            eventPattern: JSON.stringify({
                source: ["aws.guardduty"],
                "detail-type": ["GuardDuty Malware Protection Object Scan Result"]
            })
        }
    });

    app.addResource(aws.lambda.Permission, {
        name: "fm-bucket-malware-protection-event-permission",
        config: {
            action: "lambda:InvokeFunction",
            function: threatDetectionHandler.output.arn,
            principal: "events.amazonaws.com",
            sourceArn: eventRule.output.arn
        }
    });

    app.addResource(aws.cloudwatch.EventTarget, {
        name: `fm-bucket-malware-protection-event-target`,
        config: {
            rule: eventRule.output.name,
            arn: threatDetectionHandler.output.arn,
            eventBusName: core.eventBusName
        }
    });
};
