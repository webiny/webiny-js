import { KernelExecutionId } from "./KernelExecutionId.js";
import type { KernelExecutionScope } from "./KernelExecutionScope.js";

/**
 * Reads the running execution from the app's `KernelExecutionScope`, so the answer follows the
 * caller's async context: two executions running at once each get their own id.
 */
export class DefaultKernelExecutionId implements KernelExecutionId.Interface {
    constructor(private readonly scope: KernelExecutionScope.Interface) {}

    getId(): string | undefined {
        return this.scope.getCurrent()?.executionId;
    }
}
