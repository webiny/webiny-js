import type { HandlerExecutionScope } from "./HandlerExecutionScope.js";

function describeCurrent(owner: HandlerExecutionScope.Frame, current: HandlerExecutionScope.Frame) {
    if (owner.executionId === current.executionId) {
        return "a later handler execution with the same id";
    }
    return `handler execution "${current.executionId}"`;
}

export class StaleHandlerExecutionError extends Error {
    constructor(
        owner: HandlerExecutionScope.Frame,
        current: HandlerExecutionScope.Frame,
        service?: string
    ) {
        const currentDescription = describeCurrent(owner, current);
        const message = [
            `${service ?? "A service"} belongs to handler execution "${owner.executionId}" but was used during ${currentDescription}.`,
            `Something kept it after its handler execution ended, so this one would have run with an earlier one's state.`,
            `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
            `declare the dependency in builder.addResolver({ dependencies }) instead.`
        ].join(" ");

        super(message);
        this.name = "StaleHandlerExecutionError";
    }
}
