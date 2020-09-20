import { createHandler } from "@webiny/handler-aws";
import validateAccessToken from "@webiny/api-security-user-management/personalAccessToken/validator";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";

export const handler = createHandler(
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),
    // TODO: We'll revisit this later
    validateAccessToken()
);
