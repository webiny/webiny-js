const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");
const pRetry = require("p-retry");
const PRETRY_ARGS = { retries: 3 };
const get = require("lodash.get");
const set = require("lodash.set");

module.exports = async ({ bucket, region, component, s3Output, manageS3ObjectsLambdaOutput }) => {
    const s3 = new S3({ region });

    let path = "state.s3Bucket.CORSConfiguration";
    if (!get(component, path)) {
        set(component, path, {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["POST", "GET"],
                    AllowedOrigins: ["*"],
                    MaxAgeSeconds: 3000
                }
            ]
        });

        await pRetry(
            () =>
                s3
                    .putBucketCors({
                        Bucket: s3Output.name,
                        CORSConfiguration: get(component, path)
                    })
                    .promise(),
            PRETRY_ARGS
        );

        await component.save();
        component.context.debug(
            `[Webiny] Saved state for serverless-files component: applied CORS configuration to the "${bucket}" S3 bucket.`
        );
    }

    path = "state.lambda.manageS3Objects.permissions";
    if (!get(component, path)) {
        set(component, path, {
            Action: "lambda:InvokeFunction",
            FunctionName: manageS3ObjectsLambdaOutput.name,
            Principal: "s3.amazonaws.com",
            StatementId: `s3invoke`,
            SourceArn: `arn:aws:s3:::${s3Output.name}`
        });

        const lambda = new Lambda({ region });
        await pRetry(() => lambda.addPermission(get(component, path)).promise(), PRETRY_ARGS);

        await component.save();
        component.context.debug(
            `[Webiny] Saved state for serverless-files component: added "lambda:InvokeFunction" permission to the "manageS3Objects" Lambda.`
        );
    }

    path = "state.s3Bucket.bucketNotificationConfiguration";
    if (!get(component, path)) {
        set(component, path, {
            LambdaFunctionConfigurations: [
                {
                    LambdaFunctionArn: manageS3ObjectsLambdaOutput.arn,
                    Events: ["s3:ObjectRemoved:*"]
                }
            ]
        });

        await pRetry(
            () =>
                s3
                    .putBucketNotificationConfiguration({
                        Bucket: s3Output.name,
                        NotificationConfiguration: get(component, path)
                    })
                    .promise(),
            PRETRY_ARGS
        );

        await component.save();
        component.context.debug(
            `[Webiny] Saved state for serverless-files component: applied bucket notification configuration to the "${bucket}" S3 bucket.`
        );
    }
};
