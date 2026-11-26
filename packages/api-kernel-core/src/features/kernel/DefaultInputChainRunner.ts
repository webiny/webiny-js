import { InputChainRunner } from "./InputChainRunner.js";
import { executeChain } from "./chain.js";

class DefaultInputChainRunnerImpl implements InputChainRunner.Interface {
    run(request: InputChainRunner.Request): Promise<any> {
        const handlers = request.container.resolveAll(request.abstraction);
        return executeChain(handlers, request.input);
    }
}

/** Resolves the handler chain from the container it is given, and runs it. */
export const DefaultInputChainRunner = InputChainRunner.createImplementation({
    implementation: DefaultInputChainRunnerImpl,
    dependencies: []
});
