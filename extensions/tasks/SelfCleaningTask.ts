import { TaskDefinition } from "webiny/api/tasks";
import { ListModelsUseCase } from "webiny/api/cms/model.js";
import { ListLatestEntriesUseCase } from "webiny/api/cms/entry";

class SelfCleaningTaskImpl implements TaskDefinition.Interface {
    public readonly id = "selfCleaningTask";
    public readonly title = "Self-Cleaning Task";
    public readonly description =
        "A task which will remove db records related to itself after execution.";
    public readonly isPrivate = false;
    public readonly selfCleanup = "always";

    public constructor(
        private readonly listCmsModels: ListModelsUseCase.Interface,
        private readonly listLatestCmsEntries: ListLatestEntriesUseCase.Interface
    ) {}

    public async run(params: TaskDefinition.RunParams): Promise<TaskDefinition.Result> {
        // NOTE (temporary): `controller.response` is added to api-core's TaskController by a
        // `declare module` augmentation living in @webiny/background-tasks. It only resolves when
        // that augmentation is in the compile program (i.e. something imports background-tasks).
        // The api-infra handler no longer pulls it into scope, so these fail to typecheck.
        // Suppressed for now pending a proper fix (make the full controller interface part of
        // api-core, or a robust augmentation loader) — to be discussed with the team.
        const { controller } = params;

        const modelsResult = await this.listCmsModels.execute();
        if (modelsResult.isFail()) {
            // @ts-expect-error see TaskController augmentation note above
            return controller.response.error("Failed to list CMS models.");
        }
        const model = modelsResult.value[0];
        if (!model) {
            // @ts-expect-error see TaskController augmentation note above
            return controller.response.error("No CMS models found.");
        }
        const titleFieldId = model.titleFieldId;

        const entriesResult = await this.listLatestCmsEntries.execute(model, {
            limit: 1
        });

        if (entriesResult.isFail()) {
            // @ts-expect-error see TaskController augmentation note above
            return controller.response.error(
                `Failed to list latest CMS entries for model ${model.modelId}.`
            );
        }
        const entry = entriesResult.value.entries[0];
        if (!entry) {
            // @ts-expect-error see TaskController augmentation note above
            return controller.response.error(`No CMS entries found for model ${model.modelId}.`);
        }

        // @ts-expect-error see TaskController augmentation note above
        return controller.response.done(
            `Found entry with a title: ${entry.values[titleFieldId] || entry.id}`
        );
    }
}

export default TaskDefinition.createImplementation({
    implementation: SelfCleaningTaskImpl,
    dependencies: [ListModelsUseCase, ListLatestEntriesUseCase]
});
