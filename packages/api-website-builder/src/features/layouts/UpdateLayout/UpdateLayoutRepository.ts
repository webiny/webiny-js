import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { UpdateLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbLayout, LayoutModelProvider } from "~/domain/layout/abstractions.js";
import {
    LayoutLockedError,
    LayoutNotFoundError,
    LayoutPersistenceError,
    LayoutValidationError
} from "~/domain/layout/errors.js";
import { EntryToLayoutMapper } from "~/domain/layout/EntryToLayoutMapper.js";

class UpdateLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: LayoutModelProvider.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async execute(id: string, data: RepositoryAbstraction.Data): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const result = await this.updateEntry.execute<CmsEntryWbLayout>(model, id, {
            values: data
        });

        if (result.isFail()) {
            switch (result.error.code) {
                case "Cms/Entry/ValidationError":
                    return Result.fail(new LayoutValidationError(result.error.message));
                case "Cms/Entry/NotFound":
                    return Result.fail(new LayoutNotFoundError(id));
                case "Cms/Entry/Locked":
                    return Result.fail(new LayoutLockedError(id));
                default:
                    return Result.fail(new LayoutPersistenceError(result.error));
            }
        }

        return Result.ok(EntryToLayoutMapper.toLayout(result.value));
    }
}

export const UpdateLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateLayoutRepositoryImpl,
    dependencies: [LayoutModelProvider, UpdateEntryUseCase]
});
