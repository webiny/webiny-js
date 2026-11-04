import type { RoutingInspection } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { InspectRoutingUseCase as UseCaseAbstraction } from "./abstractions.js";

class InspectRoutingUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<RoutingInspection> {
        return this.repository.inspectRouting(params);
    }
}

export const InspectRoutingUseCase = UseCaseAbstraction.createImplementation({
    implementation: InspectRoutingUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
