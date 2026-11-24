import { AsyncLocalStorage } from "node:async_hooks";
import { KernelExecutionScope } from "./KernelExecutionScope.js";
import { getExecutionFrame } from "./KernelExecutionScope.js";
import { isNestedFrame } from "./KernelExecutionScope.js";
import { StaleKernelExecutionError } from "./StaleKernelExecutionError.js";

class DefaultKernelExecutionScopeImpl implements KernelExecutionScope.Interface {
    /*
     * One storage for every execution of the app. It must not be per execution: a stale service
     * holds its own execution's objects, and only a storage shared by all of them can tell it which
     * execution is running now. It holds either an execution's frame or a nested frame of it.
     */
    private readonly storage = new AsyncLocalStorage<KernelExecutionScope.Frame>();

    run<T>(executionId: string, cb: () => T): T {
        const frame: KernelExecutionScope.Frame = { executionId };
        return this.storage.run(frame, cb);
    }

    runNested<T>(frame: KernelExecutionScope.NestedFrame, cb: () => T): T {
        const current = this.storage.getStore();
        // A scope kept past its execution (cached in module scope) must not be entered by a later one.
        if (current && getExecutionFrame(current) !== frame.execution) {
            throw new StaleKernelExecutionError(
                frame.execution,
                current,
                `Scope "${frame.scopeId}"`
            );
        }
        return this.storage.run(frame, cb);
    }

    getCurrent(): KernelExecutionScope.Frame | undefined {
        const current = this.storage.getStore();
        return current ? getExecutionFrame(current) : undefined;
    }

    getCurrentNested(): KernelExecutionScope.NestedFrame | undefined {
        const current = this.storage.getStore();
        return current && isNestedFrame(current) ? current : undefined;
    }

    assertOwner(owner: KernelExecutionScope.Frame | undefined, service?: string): void {
        const current = this.storage.getStore();
        if (!owner || !current) {
            return;
        }
        /*
         * Frames are compared by identity, not by id: every `run()` creates its own frame, while an
         * id can repeat (Lambda reuses the request id when it retries an async invocation), and two
         * scopes of one execution may share a name.
         */
        if (getExecutionFrame(owner) !== getExecutionFrame(current)) {
            throw new StaleKernelExecutionError(owner, current, service);
        }
        // A service of the execution's own container may be used from any scope of that execution.
        if (!isNestedFrame(owner) || owner === current) {
            return;
        }
        throw new StaleKernelExecutionError(owner, current, service);
    }
}

export const DefaultKernelExecutionScope = KernelExecutionScope.createImplementation({
    implementation: DefaultKernelExecutionScopeImpl,
    dependencies: []
});
