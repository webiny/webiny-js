import { Result } from "@webiny/feature/api";
import type { CmsEntry } from "@webiny/api-headless-cms/types";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { CreateLayoutRevisionFromRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import {
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class CreateLayoutRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private createRevisionFrom: CreateEntryRevisionFromUseCase.Interface
    ) {}

    async execute(id: string): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.createRevisionFrom.execute(model, id, {
            values: {}
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new LayoutValidationError(result.error.message));
            }
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new LayoutNotFoundError(id));
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(EntryToLayoutMapper.toLayout(result.value as CmsEntry<CmsEntryWbLayout>));
    }
}

export const CreateLayoutRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateLayoutRevisionFromRepositoryImpl,
    dependencies: [LayoutModelProvider, CreateEntryRevisionFromUseCase]
});
