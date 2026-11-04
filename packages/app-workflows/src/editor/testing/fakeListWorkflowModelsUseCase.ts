import type { Mock } from "vitest";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";

// The ListWorkflowModels use case as a test double: only `execute`, a vitest mock (R355).
export interface FakeListWorkflowModelsUseCase extends ListWorkflowModelsUseCase.Interface {
    execute: Mock<ListWorkflowModelsUseCase.Interface["execute"]>;
}
