import { Abstraction } from "@webiny/di";

export const AwsLambdaEvent = new Abstraction<any>("AwsLambdaEvent");

export namespace AwsLambdaEvent {
    export type Interface = any;
}
