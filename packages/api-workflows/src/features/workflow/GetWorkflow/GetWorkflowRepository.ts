import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { type IWorkflow, WorkflowMapper, WorkflowModel } from "~/domain/workflow/abstractions.js";
import { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { GetWorkflowRepository as Repository } from "./abstractions.js";

class GetWorkflowRepositoryImpl implements Repository.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private model: WorkflowModel.Interface,
        private mapper: WorkflowMapper.Interface
    ) {}

    async execute(input: Repository.Params): Repository.Return {
        const id = createIdentifier({
            id: input.id,
            version: 1
        });

        const entryResult = await this.getEntryById.execute<IWorkflow>(this.model, id);

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(
                    new WorkflowNotFoundError({
                        id: input.id,
                        app: input.app
                    })
                );
            }

            return Result.fail(new WorkflowPersistenceError(entryResult.error));
        }

        const entry = entryResult.value;

        // Check if the app matches
        if (entry.values.app !== input.app) {
            return Result.fail(
                new WorkflowNotFoundError({
                    id: input.id,
                    app: input.app
                })
            );
        }

        const workflow = this.mapper.fromCmsEntry(entry);
        return Result.ok(workflow);
    }
}

export const GetWorkflowRepository = Repository.createImplementation({
    implementation: GetWorkflowRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, WorkflowModel, WorkflowMapper]
});
