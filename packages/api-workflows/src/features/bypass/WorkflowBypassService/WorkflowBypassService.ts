import { AsyncLocalStorage } from "async_hooks";
import { WorkflowBypassService as Abstraction } from "./abstractions.js";

class WorkflowBypassServiceImpl implements Abstraction.Interface {
    /** Scopes the flag to the callback's async call chain, so concurrent work never sees it. */
    private readonly storage = new AsyncLocalStorage<boolean>();

    public async run<T>(callback: () => Promise<T>): Promise<T> {
        return this.storage.run(true, callback);
    }

    public isActive(): boolean {
        return this.storage.getStore() === true;
    }
}

export const WorkflowBypassService = Abstraction.createImplementation({
    implementation: WorkflowBypassServiceImpl,
    dependencies: []
});
