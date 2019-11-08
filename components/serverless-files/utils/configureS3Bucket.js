const S3 = require("aws-sdk/clients/s3");
const Lambda = require("aws-sdk/clients/lambda");
const pRetry = require("p-retry");
const PRETRY_ARGS = { retries: 3 };
const get = require("lodash.get");
const set = require("lodash.set");

module.exports = async ({ bucket, region, component, s3Output, manageFilesLambdaOutput }) => {
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
        component.context.instance.debug(`Applied CORS configuration to the %o S3 bucket.`, bucket);
    }

    path = "state.lambda.manageS3Objects.permissions";
    if (!get(component, path)) {
        set(component, path, {
            Action: "lambda:InvokeFunction",
            FunctionName: manageFilesLambdaOutput.name,
            Principal: "s3.amazonaws.com",
            StatementId: `s3invoke`,
            SourceArn: `arn:aws:s3:::${s3Output.name}`
        });

        const lambda = new Lambda({ region });
        await pRetry(() => lambda.addPermission(get(component, path)).promise(), PRETRY_ARGS);

        await component.save();
        component.context.instance.debug(
            `Added %o permission to the %o Lambda.`,
            "lambda:InvokeFunction",
            "manageS3Objects"
        );
    }

    path = "state.s3Bucket.bucketNotificationConfiguration";
    if (!get(component, path)) {
        set(component, path, {
            LambdaFunctionConfigurations: [
                {
                    LambdaFunctionArn: manageFilesLambdaOutput.arn,
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
        component.context.instance.debug(
            `Applied bucket notification configuration to the %o S3 bucket.`,
            bucket
        );
    }
};
