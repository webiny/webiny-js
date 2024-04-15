import { createApiApp } from "@webiny/serverless-cms-aws";
import { applyWebsiteEnvVariables } from "@demo/pulumi";

export default createApiApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi(app) {
        applyWebsiteEnvVariables(app);
    }
});
