import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

import App from "./app";
import Cloudfront from "./cloudfront";

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    const app = new App();
    const cloudfront = new Cloudfront({ appS3Bucket: app.bucket });

    return { appUrl: cloudfront.distribution.domainName.apply(value => `https://${value}`) };
};
