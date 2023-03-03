import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { PulumiApp } from "@webiny/pulumi";
import { isResourceOfType } from "@webiny/pulumi";

interface AddLambdaFunctionsListOutput {
    app: PulumiApp;
}

type LambdaFunctionsList = Array<{
    name: pulumi.Output<string>;
    arn: pulumi.Output<string>;
}>;

/**
 * Based on the provided Cloudfront distribution and map,
 * adds domain and URL-related values to final stack output.
 */
export const addLambdaFunctionsListOutput = (params: AddLambdaFunctionsListOutput) => {
    const { app } = params;

    const lambdaFunctionsList: LambdaFunctionsList = [];

    app.onResource(resource => {
        if (isResourceOfType(resource, aws.lambda.Function)) {
            lambdaFunctionsList.push({ name: resource.output.name, arn: resource.output.arn });
            app.addOutputs({ lambdaFunctionsList });
        }
    });
};
