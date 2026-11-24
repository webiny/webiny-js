import type { KernelExecution } from "./KernelExecution.js";
import type { KernelExecutionScope } from "./KernelExecutionScope.js";
import { DefaultNestedKernelExecution } from "./DefaultNestedKernelExecution.js";

/**
 * The kernel execution a container was built in. `ChildContainerFactory` registers one per
 * container, holding the frame `Kernel.handle()` opened for that execution and the app's scope
 * to compare it against.
 */
export class DefaultKernelExecution implements KernelExecution.Interface {
    constructor(
        private readonly frame: KernelExecutionScope.Frame,
        private readonly scope: KernelExecutionScope.Interface
    ) {}

    getId(): string {
        return this.frame.executionId;
    }

    getScopeId(): string | undefined {
        return undefined;
    }

    assertCurrent(service?: string): void {
        this.scope.assertOwner(this.frame, service);
    }

    createNested(scopeId: string): KernelExecution.Nested {
        return DefaultNestedKernelExecution.create(this.frame, scopeId, this.scope);
    }
}
