import { AsyncLocalStorage } from "node:async_hooks";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import { StaleHandlerExecutionError } from "./StaleHandlerExecutionError.js";

class DefaultHandlerExecutionScopeImpl implements HandlerExecutionScope.Interface {
    /*
     * One storage for every execution of the app. It must not be per execution: a stale service
     * holds its own execution's objects, and only a storage shared by all of them can tell it which
     * execution is running now.
     */
    private readonly storage = new AsyncLocalStorage<HandlerExecutionScope.Frame>();

    run<T>(executionId: string, cb: () => T): T {
        const frame: HandlerExecutionScope.Frame = { executionId };
        return this.storage.run(frame, cb);
    }

    getCurrent(): HandlerExecutionScope.Frame | undefined {
        return this.storage.getStore();
    }

    assertOwner(owner: HandlerExecutionScope.Frame | undefined, service?: string): void {
        const current = this.storage.getStore();
        if (!owner || !current || owner.executionId === current.executionId) {
            return;
        }
        throw new StaleHandlerExecutionError(owner, current, service);
    }
}

export const DefaultHandlerExecutionScope = HandlerExecutionScope.createImplementation({
    implementation: DefaultHandlerExecutionScopeImpl,
    dependencies: []
});
