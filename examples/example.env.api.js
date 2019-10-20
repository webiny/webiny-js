/**
 * This file contains environment variables for all app environments.
 * It is loaded by `env-cmd` cli tool before building the React app.
 *
 * For more details on usage, see https://www.npmjs.com/package/env-cmd.
 */
module.exports = {
    default: {
        AWS_PROFILE: "default",
        AWS_REGION: "us-east-1",
        AWS_S3_BUCKET: "[YOUR_BUCKET_NAME]",
        MONGODB_SERVER: "[MONGODB_SERVER]",
        MONGODB_NAME: "webiny",
        JWT_SECRET: "MyS3cr3tK3Y!",
        STAGE: "prod"
    }
};
