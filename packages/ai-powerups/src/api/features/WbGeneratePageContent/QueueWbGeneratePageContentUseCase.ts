import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { QueueWbGeneratePageContentUseCase } from "./abstractions.js";
import {
    WB_GENERATE_PAGE_CONTENT_TASK_ID,
    type IWbGeneratePageContentTaskInput
} from "./WbGeneratePageContentTask.js";

class QueueWbGeneratePageContentUseCaseImpl implements QueueWbGeneratePageContentUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private taskService: TaskService.Interface
    ) {}

    async execute(
        params: QueueWbGeneratePageContentUseCase.Params
    ): QueueWbGeneratePageContentUseCase.Return {
        // The task calls the AI providers with the project's keys, so only identities that can
        // write Website Builder pages can queue one.
        if (!(await this.canWritePages())) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.taskService.trigger<IWbGeneratePageContentTaskInput>({
            definition: WB_GENERATE_PAGE_CONTENT_TASK_ID,
            input: {
                prompt: params.prompt,
                components: params.components,
                tools: params.tools,
                projectId: params.projectId ?? null,
                excludedFileIds: params.excludedFileIds ?? null,
                readerPersonaId: params.readerPersonaId ?? null,
                writerPersonaId: params.writerPersonaId ?? null
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok({ id: result.value.id });
    }

    private async canWritePages(): Promise<boolean> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return false;
        }
        // Matches "wb.page", "wb.*" and "*".
        const permissions = await this.identityContext.getPermissions("wb.page");
        return permissions.some(permission => {
            if (typeof permission.rwd !== "string") {
                return true;
            }
            return permission.rwd.includes("w");
        });
    }
}

export const QueueWbGeneratePageContentUseCaseImplementation =
    QueueWbGeneratePageContentUseCase.createImplementation({
        implementation: QueueWbGeneratePageContentUseCaseImpl,
        dependencies: [IdentityContext, TaskService]
    });
