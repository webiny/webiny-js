import type { Context } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";

export const AwsLambdaContext = new Abstraction<Context>("AwsLambdaContext");

export namespace AwsLambdaContext {
    export type Interface = Context;
}
