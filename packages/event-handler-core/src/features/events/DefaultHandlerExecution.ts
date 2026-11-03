import { HandlerExecution } from "./HandlerExecution.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import { RequestId } from "./RequestId.js";

class DefaultHandlerExecutionImpl implements HandlerExecution.Interface {
    constructor(private readonly requestId: RequestId.Interface) {}

    getId(): string {
        return this.requestId.value;
    }

    assertCurrent(service: string): void {
        HandlerExecutionScope.assertOwner(service, this.requestId.value);
    }
}

export const DefaultHandlerExecution = HandlerExecution.createImplementation({
    implementation: DefaultHandlerExecutionImpl,
    dependencies: [RequestId]
});
