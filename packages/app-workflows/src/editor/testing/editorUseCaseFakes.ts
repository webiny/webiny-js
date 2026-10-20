import type { Mock } from "vitest";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

// The editor use cases as test doubles, one per use case: only `execute`, a vitest mock (R355).

export interface FakeListWorkflowModelsUseCase extends ListWorkflowModelsUseCase.Interface {
    execute: Mock<ListWorkflowModelsUseCase.Interface["execute"]>;
}

export interface FakeGetWorkflowUseCase extends GetWorkflowUseCase.Interface {
    execute: Mock<GetWorkflowUseCase.Interface["execute"]>;
}

export interface FakeStoreWorkflowUseCase extends StoreWorkflowUseCase.Interface {
    execute: Mock<StoreWorkflowUseCase.Interface["execute"]>;
}

export interface FakeDeleteWorkflowUseCase extends DeleteWorkflowUseCase.Interface {
    execute: Mock<DeleteWorkflowUseCase.Interface["execute"]>;
}

export interface FakeInspectRoutingUseCase extends InspectRoutingUseCase.Interface {
    execute: Mock<InspectRoutingUseCase.Interface["execute"]>;
}

export interface FakeFolderExistsUseCase extends FolderExistsUseCase.Interface {
    execute: Mock<FolderExistsUseCase.Interface["execute"]>;
}
