import type { KernelExecution } from "./KernelExecution.js";
import type { KernelExecutionScope } from "./KernelExecutionScope.js";
import { getExecutionFrame } from "./KernelExecutionScope.js";

/**
 * A nested scope of a kernel execution. It keeps one frame for its whole life, so entering the
 * scope again runs in the same frame, and services built for it keep passing the check there.
 */
export class DefaultNestedKernelExecution implements KernelExecution.Nested {
    /**
     * Creates a new nested scope of the execution `parent` belongs to. `parent` may be the
     * execution's own frame or another nested frame of it: the new scope is always a direct scope
     * of the execution.
     */
    static create(
        parent: KernelExecutionScope.Frame,
        scopeId: string,
        scope: KernelExecutionScope.Interface
    ): DefaultNestedKernelExecution {
        const execution = getExecutionFrame(parent);
        const frame: KernelExecutionScope.NestedFrame = {
            executionId: execution.executionId,
            scopeId,
            execution
        };
        return new DefaultNestedKernelExecution(frame, scope);
    }

    private constructor(
        private readonly frame: KernelExecutionScope.NestedFrame,
        private readonly scope: KernelExecutionScope.Interface
    ) {}

    getId(): string {
        return this.frame.executionId;
    }

    getScopeId(): string {
        return this.frame.scopeId;
    }

    assertCurrent(service?: string): void {
        this.scope.assertOwner(this.frame, service);
    }

    createNested(scopeId: string): KernelExecution.Nested {
        return DefaultNestedKernelExecution.create(this.frame, scopeId, this.scope);
    }

    run<T>(cb: () => T): T {
        return this.scope.runNested(this.frame, cb);
    }
}
