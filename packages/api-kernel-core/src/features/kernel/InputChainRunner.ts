import { Abstraction } from "@webiny/di";
import type { Container } from "@webiny/di";
import type { IInputHandler } from "./InputHandler.js";

export interface IInputChainRunRequest {
    /** The container the handler chain is resolved from and runs in. */
    container: Container;
    /** The handler abstraction of the input type that matched the input. */
    abstraction: Abstraction<IInputHandler>;
    /** The input, as the platform passed it. */
    input: any;
}

/**
 * Resolves an input's handler chain and runs it. `KernelExecutionRunner` calls it once the input
 * matched an input type, with the execution's own container. The default resolves the chain from
 * that container.
 *
 * Decoratable, to run the chain in another container: a decorator can pass a container nested in
 * the execution's one (a tenant's scope), and the whole chain, decorators included, is then built
 * and runs there. Building the chain builds every handler's dependencies, so a decorator of the
 * handler itself can't do this: by the time it runs, the handlers below it were already built in
 * the execution's container.
 */
export interface IInputChainRunner {
    run(request: IInputChainRunRequest): Promise<any>;
}

export const InputChainRunner = new Abstraction<IInputChainRunner>("InputChainRunner");

export namespace InputChainRunner {
    export type Interface = IInputChainRunner;
    export type Request = IInputChainRunRequest;
}
