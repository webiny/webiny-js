import { Result } from "@webiny/feature/api";
import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ICmsEntrySystem } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/di";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { EntryPersistenceError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

/** Fails only the write that clears `system.workflow`; every other system write goes through. */
class FailingClearWorkflowUpdateEntrySystem implements UpdateEntrySystemUseCase.Interface {
    public constructor(private decoratee: UpdateEntrySystemUseCase.Interface) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        system: Partial<ICmsEntrySystem>
    ): UpdateEntrySystemUseCase.Return<T> {
        if (system.workflow === null) {
            return Result.fail(new EntryPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.execute<T>(model, id, system);
    }
}

/** The system write that clears a revision's review state returns a failed result (`legacyPlugins`). */
export const failClearWorkflowSystemWrite = (container: Container) => {
    container.registerDecorator(
        UpdateEntrySystemUseCase.createDecorator({
            decorator: FailingClearWorkflowUpdateEntrySystem,
            dependencies: []
        })
    );
};
