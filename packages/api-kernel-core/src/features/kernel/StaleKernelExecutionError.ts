import type { KernelExecutionScope } from "./KernelExecutionScope.js";
import { getExecutionFrame } from "./KernelExecutionScope.js";
import { isNestedFrame } from "./KernelExecutionScope.js";

function describeOwner(owner: KernelExecutionScope.Frame) {
    const execution = `kernel execution "${getExecutionFrame(owner).executionId}"`;
    return isNestedFrame(owner) ? `scope "${owner.scopeId}" of ${execution}` : execution;
}

function describeCurrentExecution(
    owner: KernelExecutionScope.Frame,
    current: KernelExecutionScope.Frame
) {
    const currentId = getExecutionFrame(current).executionId;
    if (getExecutionFrame(owner).executionId === currentId) {
        return "a later kernel execution with the same id";
    }
    return `kernel execution "${currentId}"`;
}

function describeCurrentScope(
    owner: KernelExecutionScope.NestedFrame,
    current: KernelExecutionScope.Frame
) {
    if (!isNestedFrame(current)) {
        return "outside any scope";
    }
    if (current.scopeId === owner.scopeId) {
        return `inside another scope also named "${current.scopeId}"`;
    }
    return `inside scope "${current.scopeId}"`;
}

function createStaleExecutionMessage(
    owner: KernelExecutionScope.Frame,
    current: KernelExecutionScope.Frame,
    service: string
) {
    return [
        `${service} belongs to ${describeOwner(owner)} but was used during ${describeCurrentExecution(owner, current)}.`,
        `Something kept it after its kernel execution ended, so this one would have run with an earlier one's state.`,
        `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
        `declare the dependency in builder.addResolver({ dependencies }) instead.`
    ].join(" ");
}

function createWrongScopeMessage(
    owner: KernelExecutionScope.NestedFrame,
    current: KernelExecutionScope.Frame,
    service: string
) {
    return [
        `${service} belongs to ${describeOwner(owner)} but was used ${describeCurrentScope(owner, current)}.`,
        `A service built in a scope acts on that scope's state, so here it would have acted on the wrong one.`,
        `Inside a scope's callback, resolve services from the scope it passes in instead of using one captured from outside.`
    ].join(" ");
}

/**
 * Thrown when a service is used where its state doesn't apply: during a later kernel execution
 * than the one it was built for, or, within one execution, outside the nested scope it was built
 * for.
 */
export class StaleKernelExecutionError extends Error {
    constructor(
        owner: KernelExecutionScope.Frame,
        current: KernelExecutionScope.Frame,
        service?: string
    ) {
        const name = service ?? "A service";
        const sameExecution = getExecutionFrame(owner) === getExecutionFrame(current);
        const message =
            sameExecution && isNestedFrame(owner)
                ? createWrongScopeMessage(owner, current, name)
                : createStaleExecutionMessage(owner, current, name);

        super(message);
        this.name = "StaleKernelExecutionError";
    }
}
