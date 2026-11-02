import type { Mock } from "vitest";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

// The StoreWorkflow use case as a test double: only `execute`, a vitest mock (R355).
export interface FakeStoreWorkflowUseCase extends StoreWorkflowUseCase.Interface {
    execute: Mock<StoreWorkflowUseCase.Interface["execute"]>;
}
