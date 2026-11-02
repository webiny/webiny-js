import type { Mock } from "vitest";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";

// The DeleteWorkflow use case as a test double: only `execute`, a vitest mock (R355).
export interface FakeDeleteWorkflowUseCase extends DeleteWorkflowUseCase.Interface {
    execute: Mock<DeleteWorkflowUseCase.Interface["execute"]>;
}
