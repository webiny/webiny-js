import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for the AWS Lambda Event object.
 * This can be injected into services that need access to the raw Lambda event.
 */
export const AwsLambdaEvent = createAbstraction<any>("AwsLambdaEvent");

export namespace AwsLambdaEvent {
    export type Interface = any;
}
