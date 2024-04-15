import { createWebsiteAppConfig } from "@webiny/serverless-cms-aws";
import { applyWebsiteConfig } from "@demo/pulumi";

export default createWebsiteAppConfig(({ config }) => {
    applyWebsiteConfig(config);
});
