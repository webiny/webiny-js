import App from "./app";
import Cloudfront from "./cloudfront";

const app = new App();

const cloudfront = new Cloudfront({ appS3Bucket: app.bucket });

export const appUrl = cloudfront.distribution.domainName.apply(value => `https://${value}`);
