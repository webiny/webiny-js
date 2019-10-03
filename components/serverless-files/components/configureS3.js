const S3 = require("aws-sdk/clients/s3");

module.exports = async s3Output => {
    const s3Instance = new S3({
        region: "us-east-1"
    });

    // Sleep a bit, just so we're sure S3 bucket was created.
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        await s3Instance
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
            .promise();
    } catch (e) {
        console.warn(e.message);
    }
};
