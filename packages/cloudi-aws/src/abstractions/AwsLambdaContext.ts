import type { Context } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for the AWS Lambda Context object.
 * This can be injected into services that need access to the Lambda context (e.g. Loggers).
 */
export const AwsLambdaContext = createAbstraction<Context>("AwsLambdaContext");

export namespace AwsLambdaContext {
    export type Interface = Context;
}
