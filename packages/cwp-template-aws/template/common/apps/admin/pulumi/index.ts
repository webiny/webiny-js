import { tagResources } from "@webiny/pulumi-app-aws";

import App from "./app";
import Cloudfront from "./cloudfront";

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: String(process.env.WEBINY_PROJECT_NAME),
        WbyEnvironment: String(process.env.WEBINY_ENV)
    });

    const app = new App();
    const cloudfront = new Cloudfront({ appS3Bucket: app.bucket });

    return {
        appStorage: app.bucket.id,
        appUrl: cloudfront.distribution.domainName.apply(value => `https://${value}`)
    };
};
