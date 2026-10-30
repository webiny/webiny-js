import type { Mock } from "vitest";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";

// The GetWorkflow use case as a test double: only `execute`, a vitest mock (R355).
export interface FakeGetWorkflowUseCase extends GetWorkflowUseCase.Interface {
    execute: Mock<GetWorkflowUseCase.Interface["execute"]>;
}
