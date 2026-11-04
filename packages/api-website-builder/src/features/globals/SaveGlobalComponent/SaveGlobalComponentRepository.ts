import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { SaveGlobalComponentRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    type CmsEntryWbGlobalComponent,
    GlobalComponentModelProvider
} from "~/domain/globals/abstractions.js";
import {
    GlobalComponentPersistenceError,
    GlobalComponentValidationError
} from "~/domain/globals/errors.js";
import { EntryToGlobalComponentMapper } from "~/domain/globals/EntryToGlobalComponentMapper.js";
import { GlobalComponentEntryId } from "~/domain/globals/GlobalComponentEntryId.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";

class SaveGlobalComponentRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelProvider: GlobalComponentModelProvider.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async execute(globalComponent: CmsEntryWbGlobalComponent): RepositoryAbstraction.Return {
        const model = await this.modelProvider.get();
        const entryId = GlobalComponentEntryId.from(
            globalComponent.name,
            GlobalComponentLanguage.from(globalComponent.language),
            globalComponent.scope
        ).toString();

        const existing = await this.findEntry(entryId);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }

        let result = existing.value
            ? await this.update(existing.value.id, globalComponent)
            : await this.createEntry.execute<CmsEntryWbGlobalComponent>(model, {
                  id: entryId,
                  values: globalComponent
              });

        // A concurrent first save created the entry (with the same id) in the meantime: update it instead.
        if (result.isFail() && !existing.value) {
            const created = await this.findEntry(entryId);
            if (created.isOk() && created.value) {
                result = await this.update(created.value.id, globalComponent);
            }
        }

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/ValidationError") {
                return Result.fail(new GlobalComponentValidationError(result.error.message));
            }
            return Result.fail(new GlobalComponentPersistenceError(result.error));
        }

        return Result.ok(EntryToGlobalComponentMapper.toGlobalComponent(result.value));
    }

    // One entry per global component and language, read by its fixed id: a search-backed list can lag a write that just happened.
    private async findEntry(id: string) {
        const model = await this.modelProvider.get();
        const result = await this.getLatestRevision.execute<CmsEntryWbGlobalComponent>(model, {
            id
        });

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.ok(null);
            }
            return Result.fail(new GlobalComponentPersistenceError(result.error));
        }

        return Result.ok(result.value);
    }

    private async update(id: string, globalComponent: CmsEntryWbGlobalComponent) {
        const model = await this.modelProvider.get();
        return this.updateEntry.execute<CmsEntryWbGlobalComponent>(model, id, {
            values: globalComponent
        });
    }
}

export const SaveGlobalComponentRepository = RepositoryAbstraction.createImplementation({
    implementation: SaveGlobalComponentRepositoryImpl,
    dependencies: [
        GlobalComponentModelProvider,
        GetLatestRevisionByEntryIdUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
