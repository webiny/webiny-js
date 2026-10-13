import { Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { ListCmsEntryWorkflowsUseCase } from "../ListCmsEntryWorkflows/index.js";
import type { CmsEntryWorkflowModelWorkflow } from "./abstractions.js";
import { ListCmsEntryWorkflowModelsUseCase as UseCase } from "./abstractions.js";
import { decodeModelListCursor, encodeModelListCursor } from "./modelListCursor.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** `ListModelsUseCase` fails with this when the identity can read no model at all. */
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";

/** By name, then by model id, so equal names keep a stable order. Pure. */
const compareModels = (a: CmsModel, b: CmsModel): number => {
    return a.name.localeCompare(b.name) || a.modelId.localeCompare(b.modelId);
};

class ListCmsEntryWorkflowModelsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private listModels: ListModelsUseCase.Interface,
        private listWorkflows: ListCmsEntryWorkflowsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "manage workflows" }));
        }

        const cursor = input.after ? decodeModelListCursor(input.after) : { offset: 0 };
        if (!cursor) {
            return Result.fail(new WorkflowValidationError("The model list cursor is not valid."));
        }

        let models: Awaited<ListModelsUseCase.Return>;
        try {
            models = await this.listModels.execute({ includePrivate: false, includePlugins: true });
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (models.isFail() && models.error.code !== MODEL_NOT_AUTHORIZED) {
            return Result.fail(new WorkflowPersistenceError(models.error));
        }

        const search = (input.search ?? "").trim().toLowerCase();
        const matching = (models.isOk() ? models.value : [])
            .filter(model => isBindableModel(model))
            .filter(model => {
                if (!search) {
                    return true;
                }
                return (
                    model.name.toLowerCase().includes(search) ||
                    model.modelId.toLowerCase().includes(search)
                );
            })
            .sort(compareModels);
        const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
        const page = matching.slice(cursor.offset, cursor.offset + limit);
        const nextOffset = cursor.offset + page.length;
        const hasMoreItems = nextOffset < matching.length;

        // One list for every row; v1 binds one model per workflow (D15).
        const workflows = await this.listWorkflows.execute();
        if (workflows.isFail()) {
            return Result.fail(workflows.error);
        }
        const bound = new Map<string, CmsEntryWorkflowModelWorkflow>();
        for (const workflow of workflows.value) {
            for (const namespace of workflow.models) {
                bound.set(namespace, { id: workflow.id, name: workflow.name });
            }
        }

        return Result.ok({
            items: page.map(model => {
                const namespace = toCmsNamespace(model.modelId);
                return {
                    model: namespace,
                    modelId: model.modelId,
                    name: model.name,
                    workflow: bound.get(namespace) ?? null
                };
            }),
            meta: {
                cursor: hasMoreItems ? encodeModelListCursor({ offset: nextOffset }) : null,
                hasMoreItems
            }
        });
    }
}

export const ListCmsEntryWorkflowModelsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryWorkflowModelsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        ListModelsUseCase,
        ListCmsEntryWorkflowsUseCase
    ]
});
