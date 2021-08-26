import * as pulumi from "@pulumi/pulumi";
import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

/**
 * In order to host the React application, we deploy two cloud infrastructure resources:
 * - an S3 bucket into which the production build files are uploaded
 * - a CDN which enables us to cache production build files (CSS, JS, images)
 *
 * If needed, feel free to add new resources or modify the existing ones.
 */

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

    return { appUrl: pulumi.interpolate`https://${cloudfront.distribution.domainName}` };
};
