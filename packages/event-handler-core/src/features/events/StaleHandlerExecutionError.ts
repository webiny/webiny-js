import type { HandlerExecutionScope } from "./HandlerExecutionScope.js";

function describeFrame(frame: HandlerExecutionScope.Frame): string {
    if (!frame.requestId || frame.requestId === frame.executionId) {
        return `"${frame.executionId}"`;
    }
    return `"${frame.executionId}" (request "${frame.requestId}")`;
}

export class StaleHandlerExecutionError extends Error {
    constructor(
        owner: HandlerExecutionScope.Frame,
        current: HandlerExecutionScope.Frame,
        service?: string
    ) {
        const ownerDescription = describeFrame(owner);
        const currentDescription = describeFrame(current);
        const message = [
            `${service ?? "A service"} belongs to handler execution ${ownerDescription} but was used during handler execution ${currentDescription}.`,
            `Something kept it after its handler execution ended, so this one would have run with an earlier one's state.`,
            `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
            `declare the dependency in builder.addResolver({ dependencies }) instead.`
        ].join(" ");

        super(message);
        this.name = "StaleHandlerExecutionError";
    }
}
