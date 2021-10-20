import App from "./app";
import Delivery from "./delivery";
import { tagResources } from "@webiny/cli-plugin-deploy-pulumi/utils";

export = async () => {
    // Add tags to all resources that support tagging.
    tagResources({
        WbyProjectName: process.env.WEBINY_PROJECT_NAME as string,
        WbyEnvironment: process.env.WEBINY_ENV as string
    });

    const app = new App();
    const delivery = new Delivery({ appS3Bucket: app.bucket });

    return {
        // Cloudfront and S3 bucket used to host the single-page application (SPA). The URL of the distribution is mainly
        // utilized by the Page Builder app's prerendering engine. Using this URL, it accesses the SPA and creates HTML snapshots.
        // The files that are generated in that process are stored in the `deliveryStorage` S3 bucket further below.
        appId: app.cloudfront.id,
        appStorage: app.bucket.id,
        appUrl: app.cloudfront.domainName.apply(value => `https://${value}`),
        // These are the Cloudfront and S3 bucket that will deliver static pages to the actual website visitors.
        // The static HTML snapshots delivered from them still rely on the app's S3 bucket
        // defined above, for serving static assets (JS, CSS, images).
        deliveryId: delivery.cloudfront.id,
        deliveryStorage: delivery.bucket.id,
        deliveryUrl: delivery.cloudfront.domainName.apply(value => `https://${value}`)
    };
};
