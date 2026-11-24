import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "./InputHandler.js";

/**
 * One kind of input the kernel can be given: an SQS batch, a DynamoDB stream batch, an HTTP request,
 * a background task step. AWS calls these "events" (the Lambda handler's first argument). The kernel
 * asks every registered input type `matches(input)` and runs the handlers of the first that says yes.
 */
export interface IInputType<TInput = any> {
    matches(input: unknown): input is TInput;
    getHandlerAbstraction(): Abstraction<IInputHandler>;
}

export const InputType = new Abstraction<IInputType>("InputType");

export namespace InputType {
    export type Interface<TInput = any> = IInputType<TInput>;
}
