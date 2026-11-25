import { AsyncLocalStorage } from "node:async_hooks";
import { KernelExecutionScope } from "./KernelExecutionScope.js";
import { StaleKernelExecutionError } from "./StaleKernelExecutionError.js";

class DefaultKernelExecutionScopeImpl implements KernelExecutionScope.Interface {
    /*
     * One storage for every execution of the app. It must not be per execution: a stale service
     * holds its own execution's objects, and only a storage shared by all of them can tell it which
     * execution is running now.
     */
    private readonly storage = new AsyncLocalStorage<KernelExecutionScope.Frame>();

    run<T>(executionId: string, cb: () => T): T {
        const frame: KernelExecutionScope.Frame = { executionId };
        return this.storage.run(frame, cb);
    }

    getCurrent(): KernelExecutionScope.Frame | undefined {
        return this.storage.getStore();
    }

    assertOwner(owner: KernelExecutionScope.Frame | undefined, service?: string): void {
        const current = this.storage.getStore();
        /*
         * Executions are compared as frames, not by id: every `run()` creates its own frame, while
         * an id can repeat (Lambda reuses the request id when it retries an async invocation).
         */
        if (!owner || !current || owner === current) {
            return;
        }
        throw new StaleKernelExecutionError(owner, current, service);
    }
}

export const DefaultKernelExecutionScope = KernelExecutionScope.createImplementation({
    implementation: DefaultKernelExecutionScopeImpl,
    dependencies: []
});
