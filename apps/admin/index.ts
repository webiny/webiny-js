import App from "./stack/app";
import Cloudfront from "./stack/cloudfront";

const app = new App();

const cloudfront = new Cloudfront({ appS3Bucket: app.bucket });

export const CDN = cloudfront.distribution.domainName;
