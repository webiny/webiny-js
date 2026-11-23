import { CurrentHandlerExecution } from "./CurrentHandlerExecution.js";
import type { HandlerExecutionScope } from "./HandlerExecutionScope.js";

/**
 * Reads the running execution from the app's `HandlerExecutionScope`, so the answer follows the
 * caller's async context: two executions running at once each get their own id.
 */
export class DefaultCurrentHandlerExecution implements CurrentHandlerExecution.Interface {
    constructor(private readonly scope: HandlerExecutionScope.Interface) {}

    getId(): string | undefined {
        return this.scope.getCurrent()?.executionId;
    }
}
