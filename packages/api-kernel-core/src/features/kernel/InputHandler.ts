import { Abstraction } from "@webiny/di";
import type { NextFunction } from "./types.js";

export interface InputContext<TInput = any> {
    input: TInput;
    metadata: Record<string, any>;
}

export interface IInputHandler<TInput = any, TResult = any> {
    execute(ctx: InputContext<TInput>, next: NextFunction): Promise<TResult>;
}

export const InputHandler = new Abstraction<IInputHandler>("InputHandler");

export namespace InputHandler {
    export type Interface<TInput = any, TResult = any> = IInputHandler<TInput, TResult>;
}
