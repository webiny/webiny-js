import { randomUUID } from "node:crypto";
import { ChildContainerFactory } from "./abstractions.js";
import { KernelExecutionRunner } from "./abstractions.js";
import { RootContainerFactory } from "./abstractions.js";
import { KernelExecutionScope } from "./KernelExecutionScope.js";
import { KernelPlatform } from "./KernelPlatform.js";
import { InputType } from "./InputType.js";
import { NoMatchingInputTypeError } from "./NoMatchingInputTypeError.js";
import { executeChain } from "./chain.js";

class KernelExecutionRunnerImpl implements KernelExecutionRunner.Interface {
    constructor(
        private readonly rootContainerFactory: RootContainerFactory.Interface,
        private readonly childContainerFactory: ChildContainerFactory.Interface,
        private readonly scope: KernelExecutionScope.Interface,
        private readonly platform: KernelPlatform.Interface
    ) {}

    async execute(rawArgs: any[]): Promise<any> {
        /*
         * The root container lives for the whole process, so it is built outside any execution's
         * scope: anything long-lived it starts must not carry the first execution's id.
         */
        const root = await this.rootContainerFactory.get();
        /*
         * The platform's own id for the invocation when it has one (the AWS request id on Lambda, the
         * `lambda-web-request-id` header on a web function), a UUID otherwise. It labels the execution
         * in logs, errors and debug captures; the stale-execution check doesn't rely on it being unique.
         */
        const executionId = this.platform.getExecutionId(rawArgs) || randomUUID();

        // Everything from here on, building the execution's container included, runs in its scope.
        return this.scope.run(executionId, async () => {
            const child = await this.childContainerFactory.create(root, rawArgs);
            // The input to match on is always the first raw argument (platforms never change this).
            const input = rawArgs[0];
            const inputTypes = child.resolveAll(InputType);
            const matched = inputTypes.find(inputType => inputType.matches(input));

            if (!matched) {
                throw new NoMatchingInputTypeError(input, inputTypes);
            }

            const abstraction = matched.getHandlerAbstraction();
            const handlers = child.resolveAll(abstraction);

            return executeChain(handlers, input);
        });
    }
}

export const DefaultKernelExecutionRunner = KernelExecutionRunner.createImplementation({
    implementation: KernelExecutionRunnerImpl,
    dependencies: [
        RootContainerFactory,
        ChildContainerFactory,
        KernelExecutionScope,
        KernelPlatform
    ]
});
