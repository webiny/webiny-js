import { BeforeDeploy, LoggerService } from "@webiny/project/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import { STS } from "@webiny/aws-sdk/client-sts";

class EnsureAwsCredentialsBeforeDeployImpl implements BeforeDeploy.Interface {
    constructor(private loggerService: LoggerService.Interface) {}

    async execute() {
        process.env.AWS_SDK_LOAD_CONFIG = "true";
        const sts = new STS({});

        try {
            await sts.getCallerIdentity({});
        } catch (err) {
            this.loggerService.debug({ err }, "AWS credentials error.");
            throw GracefulError.from(
                new Error("AWS credentials are not configured correctly."),
                'No valid AWS credentials were found. Run "aws configure" or set the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables before deploying. Learn more: https://webiny.link/aws-credentials'
            );
        }

        const region = await sts.config.region();
        if (!region) {
            throw GracefulError.from(
                new Error("AWS region is not defined."),
                "No AWS region is set. Define the AWS_REGION environment variable or set a default region in your AWS profile. Learn more: https://webiny.link/aws-region"
            );
        }

        process.env.AWS_REGION = region;

        const { accessKeyId } = await sts.config.credentials();
        const profile = process.env.AWS_PROFILE;

        if (profile) {
            this.loggerService.info(`Using profile "${profile}" in "${region}" region.`);
        } else {
            this.loggerService.info(`Using access key ID "${accessKeyId}" in "${region}" region.`);
        }
    }
}

export const EnsureAwsCredentialsBeforeDeploy = BeforeDeploy.createImplementation({
    implementation: EnsureAwsCredentialsBeforeDeployImpl,
    dependencies: [LoggerService]
});
