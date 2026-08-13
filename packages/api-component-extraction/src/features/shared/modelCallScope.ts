import { AsyncLocalStorage } from "node:async_hooks";
import { createAbstraction, createImplementation } from "@webiny/feature/api";
import type { Stage } from "~/constants.js";

/**
 * The stage a model call belongs to. The runner sets this around a stage's execution; the model-call
 * recorder reads it when the core `Ai` publishes a generate-text event. Because `EventPublisher.publish`
 * runs subscribers inline and awaited within the same async call, an `AsyncLocalStorage` scope set up
 * the stack propagates to the subscriber — so Classify, Plan and Generate (the last via the
 * remote-components path) are all attributed without threading context through every call site.
 */
export interface ModelCallScopeValue {
    runId: string;
    stage: Stage;
    stageVersion: number;
}

export interface IModelCallScope {
    run<T>(scope: ModelCallScopeValue, fn: () => Promise<T>): Promise<T>;
    current(): ModelCallScopeValue | null;
}

export const ModelCallScope = createAbstraction<IModelCallScope>(
    "ComponentExtraction/ModelCallScope"
);
export namespace ModelCallScope {
    export type Interface = IModelCallScope;
    export type Value = ModelCallScopeValue;
}

// Module-level so every resolved instance shares one storage, regardless of DI scope — the runner and
// the recorder must see the same async context.
const storage = new AsyncLocalStorage<ModelCallScopeValue>();

class ModelCallScopeImpl implements IModelCallScope {
    run<T>(scope: ModelCallScopeValue, fn: () => Promise<T>): Promise<T> {
        return storage.run(scope, fn);
    }
    current(): ModelCallScopeValue | null {
        return storage.getStore() ?? null;
    }
}

export const ModelCallScopeService = createImplementation({
    abstraction: ModelCallScope,
    implementation: ModelCallScopeImpl,
    dependencies: []
});
