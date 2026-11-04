import { HandlerExecution } from "./HandlerExecution.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import type { HandlerExecutionFrame } from "./HandlerExecutionScope.js";

/**
 * The handler execution a container was built in. `ChildContainerFactory` registers one per
 * container, holding the frame `HandlerApp.handle()` opened for that execution.
 */
export class DefaultHandlerExecution implements HandlerExecution.Interface {
    constructor(private readonly frame: HandlerExecutionFrame) {}

    getId(): string {
        return this.frame.executionId;
    }

    assertCurrent(service?: string): void {
        HandlerExecutionScope.assertOwner(this.frame, service);
    }
}
