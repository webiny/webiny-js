import { Result } from "@webiny/feature/api";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GraduateVariantRepository as RepositoryAbstraction } from "./abstractions.js";
import { PageModel } from "~/domain/page/abstractions.js";
import type { WbPage } from "~/domain/page/abstractions.js";
import { EntryToPageMapper } from "~/domain/page/EntryToPageMapper.js";
import { PageNotFoundError, PagePersistenceError } from "~/domain/page/errors.js";
import { ExperimentModel } from "~/domain/experiment/abstractions.js";
import type { CmsEntryWbExperimentValues } from "~/domain/experiment/abstractions.js";
import { ExperimentPersistenceError } from "~/domain/experiment/errors.js";

class GraduateVariantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createRevisionFrom: CreateEntryRevisionFromUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private pageModel: PageModel.Interface,
        private experimentModel: ExperimentModel.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        // Resolve the baseline revision to copy its location onto the new revision.
        const baselineResult = await this.getEntryById.execute<WbPage>(
            this.pageModel,
            params.baselineRevisionId
        );
        if (baselineResult.isFail()) {
            if (baselineResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.baselineRevisionId));
            }
            return Result.fail(new PagePersistenceError(baselineResult.error));
        }

        // Create a new revision from the baseline, overriding its content with the variant snapshot.
        const revisionResult = await this.createRevisionFrom.execute(
            this.pageModel,
            params.baselineRevisionId,
            {
                location: baselineResult.value.location,
                values: {
                    properties: params.content.properties,
                    metadata: params.content.metadata,
                    bindings: params.content.bindings,
                    elements: params.content.elements,
                    extensions: params.content.extensions ?? {}
                }
            }
        );

        if (revisionResult.isFail()) {
            if (revisionResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new PageNotFoundError(params.baselineRevisionId));
            }
            return Result.fail(new PagePersistenceError(revisionResult.error));
        }

        // Mark the experiment graduated and record the winning variant.
        const updateResult = await this.updateEntry.execute<CmsEntryWbExperimentValues>(
            this.experimentModel,
            params.experimentId,
            {
                values: {
                    status: "graduated",
                    winningVariantId: params.variantId,
                    stoppedOn: new Date().toISOString()
                }
            }
        );

        if (updateResult.isFail()) {
            return Result.fail(new ExperimentPersistenceError(updateResult.error));
        }

        return Result.ok(EntryToPageMapper.toPage(revisionResult.value));
    }
}

export const GraduateVariantRepository = RepositoryAbstraction.createImplementation({
    implementation: GraduateVariantRepositoryImpl,
    dependencies: [
        CreateEntryRevisionFromUseCase,
        GetEntryByIdUseCase,
        UpdateEntryUseCase,
        PageModel,
        ExperimentModel
    ]
});
