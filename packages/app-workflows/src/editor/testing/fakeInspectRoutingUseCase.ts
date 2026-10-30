import type { Mock } from "vitest";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";

// The InspectRouting use case as a test double: only `execute`, a vitest mock (R355).
export interface FakeInspectRoutingUseCase extends InspectRoutingUseCase.Interface {
    execute: Mock<InspectRoutingUseCase.Interface["execute"]>;
}
