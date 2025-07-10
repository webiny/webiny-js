/**
 * TODO use /enterprise to test the sync system
 */
// import { createApiApp } from "@webiny/serverless-cms-aws/enterprise";
import { createApiApp } from "@webiny/serverless-cms-aws";

export default createApiApp({
    pulumiResourceNamePrefix: "wby-"
});
