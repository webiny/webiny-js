import { createApiApp } from "@webiny/serverless-cms-aws";

export default createApiApp({
    openSearch: true,
    pulumiResourceNamePrefix: "wby-"
});
