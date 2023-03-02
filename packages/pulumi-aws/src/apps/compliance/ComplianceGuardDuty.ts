import * as aws from "@pulumi/aws";
import { createAppModule } from "@webiny/pulumi";

export const ComplianceGuardDuty = createAppModule({
    name: "ComplianceGuardDuty",
    config({ addResource, getModule }) {
        addResource(aws.guardduty.Detector, {
            name: "guard-duty-detector",
            config: {
                enable: true,
                findingPublishingFrequency: "FIFTEEN_MINUTES"
            }
        });

        const snsTopic = addResource(aws.sns.Topic, { name: "guard-duty-sns-topic", config: {} });

        addResource(aws.sns.TopicSubscription, {
            name: "guard-duty-sns-topic-subscription",
            config: {
                topic: snsTopic.output.arn,
                protocol: "email",
                endpoint: "developers@webiny.com"
            }
        });

        addResource(aws.cloudwatch.EventRule, {
            name: "guard-duty-event-rule",
            config: {
                eventPattern: JSON.stringify({
                    source: ["aws.guardduty"],
                    "detail-type": ["GuardDuty Finding"],
                    detail: {
                        // Will alert for any Medium to High finding.
                        severity: [
                            4, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5, 5.0, 5.1, 5.2,
                            5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6, 6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6,
                            6.7, 6.8, 6.9, 7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8,
                            8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
                        ]
                    }
                })
            }
        });

        const snsTopicPolicy = snsTopic.output.arn.apply(arn =>
            aws.iam.getPolicyDocumentOutput({
                statements: [
                    {
                        effect: "Allow",
                        actions: ["SNS:Publish"],
                        principals: [
                            {
                                type: "Service",
                                identifiers: ["events.amazonaws.com"]
                            }
                        ],
                        resources: [arn]
                    }
                ]
            })
        );

        addResource(aws.sns.TopicPolicy, {
            name: "guard-duty-sns-topic-policy",
            config: {
                arn: snsTopic.output.arn,
                policy: snsTopicPolicy.apply(snsTopicPolicy => snsTopicPolicy.json)
            }
        });

        addResource(aws.cloudwatch.EventTarget, {
            name: "guard-duty-event-target",
            config: {
                rule: rule.name,
                arn: snsTopic.arn,
                inputTransformer: {
                    inputPaths: {
                        severity: "$.detail.severity",
                        Account_ID: "$.detail.accountId",
                        Finding_ID: "$.detail.id",
                        Finding_Type: "$.detail.type",
                        region: "$.region",
                        Finding_description: "$.detail.description"
                    },
                    inputTemplate: [
                        `"AWS <Account_ID> has a severity <severity> GuardDuty finding type <Finding_Type> in the <region> region."`,
                        `"Finding Description:"`,
                        `"<Finding_description>. "`,
                        `"For more details open the GuardDuty console at https://console.aws.amazon.com/guardduty/home?region=<region>#/findings?search=id%3D<Finding_ID>"`
                    ].join("\n")
                }
            }
        });
    }
});
