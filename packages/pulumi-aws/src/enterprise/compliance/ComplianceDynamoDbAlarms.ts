import { createAppModule } from "@webiny/pulumi";
import * as aws from "@pulumi/aws";
import { CoreOutputObject } from "~/apps";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const ComplianceDynamoDbAlarms = createAppModule({
    name: "ComplianceDynamoDbAlarms",
    config({ addResource, params }) {
        // The alarm is activated whenever the consumed read capacity is at least 4 units per second
        // (80% of provisioned read capacity of 5) for 1 minute (60 seconds). So, the threshold is 240
        // read capacity units (4 units/sec * 60 seconds). Any time the read capacity is updated you
        // should update the alarm calculations appropriately.

        const { primaryDynamodbTableName } = getStackOutput<CoreOutputObject>({
            folder: "apps/core",
            env: params.run.env
        });

        const readCapacityUnitsLimit = addResource(aws.cloudwatch.MetricAlarm, {
            name: "dynamo-db-alarm-read-capacity-units-limit",
            config: {
                alarmDescription: "Alarm when read capacity reaches 80% of what was provisioned",
                comparisonOperator: "GreaterThanOrEqualToThreshold",
                evaluationPeriods: 1,
                threshold: 240,
                metricQueries: [
                    {
                        id: "m1",
                        metric: {
                            dimensions: {
                                TableName: primaryDynamodbTableName
                            },
                            metricName: "ConsumedReadCapacityUnits",
                            namespace: "AWS/DynamoDB",
                            period: 300,
                            stat: "Average"
                        },
                        returnData: true
                    }
                ]
            }
        });

        const writeCapacityUnitsLimit = addResource(aws.cloudwatch.MetricAlarm, {
            name: "dynamo-db-alarm-write-capacity-units-limit",
            config: {
                alarmDescription: "Alarm when write capacity reaches 80% of what was provisioned",
                comparisonOperator: "GreaterThanOrEqualToThreshold",
                evaluationPeriods: 1,
                threshold: 240,
                metricQueries: [
                    {
                        id: "m1",
                        metric: {
                            dimensions: {
                                TableName: primaryDynamodbTableName
                            },
                            metricName: "ConsumedWriteCapacityUnits",
                            namespace: "AWS/DynamoDB",
                            period: 300,
                            stat: "Average"
                        },
                        returnData: true
                    }
                ]
            }
        });

        return { readCapacityUnitsLimit, writeCapacityUnitsLimit };
    }
});
