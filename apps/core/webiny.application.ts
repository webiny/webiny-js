import { createCoreApp } from "@webiny/serverless-cms-aws";
import { configureWebsiteCognitoUserPool } from "@demo/pulumi";

export default createCoreApp({
    pulumiResourceNamePrefix: "wby-",
    pulumi: app => {
        configureWebsiteCognitoUserPool(app);
    }
});
