import type * as aws from "@pulumi/aws";
import type { PulumiAppResource } from "@webiny/pulumi";
import type { ServiceManifest } from "~/pulumi/utils/addServiceManifestTableItem.js";
import { getDistributionUrl } from "~/pulumi/utils/getDistributionUrl.js";

export interface ApiServiceManifestsParams {
    cloudfront: PulumiAppResource<typeof aws.cloudfront.Distribution>;
    graphql: { functions: { graphql: PulumiAppResource<typeof aws.lambda.Function> } };
    backgroundTask: { stepFunction: PulumiAppResource<typeof aws.sfn.StateMachine> };
    scheduler: { invokeRole: PulumiAppResource<typeof aws.iam.Role> };
}

/**
 * The service manifests the api deploy publishes: `api` (its URL, the background-task state
 * machine, its CloudFront distribution) and `scheduler` (the function the scheduler invokes, and
 * the role it does it with). The API reads them through service discovery: from DynamoDB, and on
 * Postgres from the database, where the schema setup stores them.
 */
export const createApiServiceManifests = (params: ApiServiceManifestsParams): ServiceManifest[] => {
    const { cloudfront, graphql, backgroundTask, scheduler } = params;
    return [
        {
            name: "api",
            manifest: {
                // Read by the API through `PublicUrls.getApiUrl()`.
                url: getDistributionUrl(cloudfront),
                bgTaskSfn: backgroundTask.stepFunction.output.arn,
                cloudfront: {
                    distributionId: cloudfront.output.id,
                    domain: cloudfront.output.domainName.apply(v => `https://${v}`)
                }
            }
        },
        {
            name: "scheduler",
            manifest: {
                lambdaArn: graphql.functions.graphql.output.arn,
                roleArn: scheduler.invokeRole.output.arn
            }
        }
    ];
};
