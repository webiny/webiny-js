import { HandlerExecution } from "./HandlerExecution.js";
import type { HandlerExecutionScope } from "./HandlerExecutionScope.js";

/**
 * The handler execution a container was built in. `ChildContainerFactory` registers one per
 * container, holding the frame `HandlerApp.handle()` opened for that execution and the app's scope
 * to compare it against.
 */
export class DefaultHandlerExecution implements HandlerExecution.Interface {
    constructor(
        private readonly frame: HandlerExecutionScope.Frame,
        private readonly scope: HandlerExecutionScope.Interface
    ) {}

    getId(): string {
        return this.frame.executionId;
    }

    assertCurrent(service?: string): void {
        this.scope.assertOwner(this.frame, service);
    }
}
