import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { CreateLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import { LayoutPersistenceError, LayoutValidationError } from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class CreateLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async execute(
        data: RepositoryAbstraction.Data,
        options: RepositoryAbstraction.Options = {}
    ): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<CmsEntryWbLayout>(model, {
            ...(options.id ? { id: options.id } : {}),
            values: data
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new LayoutValidationError(result.error.message));
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(EntryToLayoutMapper.toLayout(result.value));
    }
}

export const CreateLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateLayoutRepositoryImpl,
    dependencies: [LayoutModelProvider, CreateEntryUseCase]
});
