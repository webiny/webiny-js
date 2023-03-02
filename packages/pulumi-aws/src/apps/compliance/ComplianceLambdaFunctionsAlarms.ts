import * as aws from "@pulumi/aws";
import { createAppModule } from "@webiny/pulumi";
import { CoreOutput, ApiOutput, WebsiteOutput } from "@webiny/pulumi-aws/apps";

export const ComplianceLambdaFunctionsAlarms = createAppModule({
    name: "ComplianceLambdaFunctionsAlarms",
    config({ addResource, getModule }) {
        const { lambdaFunctionsList: coreLambdaFunctionsList } = getModule(CoreOutput);
        const { lambdaFunctionsList: apiLambdaFunctionsList } = getModule(ApiOutput);
        const { lambdaFunctionsList: websiteLambdaFunctionsList } = getModule(WebsiteOutput);

        const lambdaFunctionsList = [
            ...coreLambdaFunctionsList,
            ...apiLambdaFunctionsList,
            ...websiteLambdaFunctionsList
        ];

        for (let i = 0; i < lambdaFunctionsList.length; i++) {
            const fn: { name: string; arn: string } = lambdaFunctionsList[i];

            addResource(aws.cloudwatch.MetricAlarm, {
                name: `${fn.name}-lambda-fn-alarm-errors`,
                config: {
                    alarmDescription: `Create alarm when ${fn.name} AWS Lambda function fails.`,
                    comparisonOperator: "GreaterThanOrEqualToThreshold",
                    evaluationPeriods: 1,
                    threshold: 0,
                    metricQueries: [
                        {
                            id: "m1",
                            metric: {
                                dimensions: {
                                    Name: "FunctionName",
                                    Value: fn.name
                                },
                                metricName: "Errors",
                                namespace: "AWS/Lambda",
                                period: 300,
                                stat: "Sum",
                                unit: "Count"
                            },
                            returnData: true
                        }
                    ]
                }
            });
        }
    }
});
