/**
 * Used by `webiny watch` (`project-aws`, `replaceWebFunction.ts`). A web function's code can't be
 * replaced in place, so watch reads the current revision, creates a revision that runs the local
 * forwarder, moves the endpoint's traffic to it, and deletes revisions left by earlier sessions.
 */
export { LambdaWebClient } from "@aws-sdk/client-lambda-web";
export { CreateWebFunctionRevisionCommand } from "@aws-sdk/client-lambda-web";
export { DeleteWebFunctionRevisionCommand } from "@aws-sdk/client-lambda-web";
export { GetWebFunctionRevisionCommand } from "@aws-sdk/client-lambda-web";
export { ListWebFunctionRevisionsCommand } from "@aws-sdk/client-lambda-web";
export { UpdateWebFunctionEndpointCommand } from "@aws-sdk/client-lambda-web";

export type { LambdaWebClientConfig } from "@aws-sdk/client-lambda-web";
export type { ServiceConfig } from "@aws-sdk/client-lambda-web";
