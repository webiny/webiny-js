import App from "./app";
import Delivery from "./delivery";

const app = new App();
const delivery = new Delivery({ appS3Bucket: app.bucket });

// Cloudfront and S3 bucket used to host the single-page application (SPA). The URL of the distribution is mainly
// utilized by the Page Builder app's prerendering engine, over which it access the SPA and saves the generated HTML.
// The files that are generated in that process will be stored in the below deliveryStorage S3 bucket.
export const appId = app.cloudfront.id;
export const appStorage = app.bucket.id;
export const appUrl = app.cloudfront.domainName.apply(value => `https://${value}`);

// Cloudfront and S3 bucket that will deliver static pages to actual website visitors. Except the fact that this
// S3 bucket is utilized by the Page Builder app's prerendering engine, in order to store the files that were
// generated in the prerendering process (as mentioned above), note that these still relies on the app's S3 bucket
// defined above, for serving static assets (JS, CSS, images).
export const deliveryId = delivery.cloudfront.id;
export const deliveryStorage = delivery.bucket.id;
export const deliveryUrl = delivery.cloudfront.domainName.apply(value => `https://${value}`);
