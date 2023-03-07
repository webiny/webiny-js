import * as aws from "@pulumi/aws";
import { createAppModule } from "@webiny/pulumi";
const { getStackExport } = require("@webiny/cli-plugin-deploy-pulumi/utils");

const getLambdaFunctionsList = (params: { folder: string; env: string }) => {
    const stackExport = getStackExport(params);
    if (!stackExport) {
        throw new Error(
            `Could not retrieve "${params.folder}" stack export. Maybe the project application wasn't deployed?`
        );
    }

    const lambdaFunctions = stackExport.filter(
        (item: any) => item.type === "aws:lambda/function:Function"
    );

    return lambdaFunctions.map((item: any) => {
        console.log("item", item);
        return { name: item.outputs.name, arn: item.outputs.arn };
    });
};

export const ComplianceLambdaFunctionsAlarms = createAppModule({
    name: "ComplianceLambdaFunctionsAlarms",
    config({ addResource, params }) {
        const { env } = params.run;
        const coreLambdaFunctionsList = getLambdaFunctionsList({ folder: "apps/core", env });
        const apiLambdaFunctionsList = getLambdaFunctionsList({ folder: "apps/api", env });
        const adminLambdaFunctionsList = getLambdaFunctionsList({ folder: "apps/admin", env });
        const websiteLambdaFunctionsList = getLambdaFunctionsList({ folder: "apps/website", env });

        const lambdaFunctionsList = [
            ...coreLambdaFunctionsList,
            ...apiLambdaFunctionsList,
            ...adminLambdaFunctionsList,
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
