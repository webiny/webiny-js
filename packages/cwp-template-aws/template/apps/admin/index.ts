import App from "./stack/app";
import Cloudfront from "./stack/cloudfront";

const app = new App();

const cloudfront = new Cloudfront({ appS3Bucket: app.bucket });

export const appUrl = cloudfront.distribution.domainName.apply(value => `https://${value}`);
