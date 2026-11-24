import type { KernelExecutionScope } from "./KernelExecutionScope.js";

function describeCurrent(owner: KernelExecutionScope.Frame, current: KernelExecutionScope.Frame) {
    if (owner.executionId === current.executionId) {
        return "a later kernel execution with the same id";
    }
    return `kernel execution "${current.executionId}"`;
}

export class StaleKernelExecutionError extends Error {
    constructor(
        owner: KernelExecutionScope.Frame,
        current: KernelExecutionScope.Frame,
        service?: string
    ) {
        const currentDescription = describeCurrent(owner, current);
        const message = [
            `${service ?? "A service"} belongs to kernel execution "${owner.executionId}" but was used during ${currentDescription}.`,
            `Something kept it after its kernel execution ended, so this one would have run with an earlier one's state.`,
            `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
            `declare the dependency in builder.addResolver({ dependencies }) instead.`
        ].join(" ");

        super(message);
        this.name = "StaleKernelExecutionError";
    }
}
