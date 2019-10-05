const S3 = require("aws-sdk/clients/s3");
const pRetry = require("p-retry");
const PRETRY_ARGS = { retries: 3 };

module.exports = async s3Output => {
    const s3 = new S3({
        region: "us-east-1"
    });

    try {
        await pRetry(() => s3.getBucketCors({ Bucket: s3Output.name }).promise(), PRETRY_ARGS);
    } catch (e) {
        // If no CORS set, upper method will throw an error, which means we have to set it here.
        await pRetry(
            () =>
                s3
                    .putBucketCors({
                        Bucket: s3Output.name,
                        CORSConfiguration: {
                            CORSRules: [
                                {
                                    AllowedHeaders: ["*"],
                                    AllowedMethods: ["POST", "GET"],
                                    AllowedOrigins: ["*"],
                                    MaxAgeSeconds: 3000
                                }
                            ]
                        }
                    })
                    .promise(),
            PRETRY_ARGS
        );
    }
};
