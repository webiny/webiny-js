import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    WB_GENERATE_PAGE_CONTENT_TASK_ID,
    type IWbGeneratePageContentTaskInput
} from "~/api/features/WbGeneratePageContent/WbGeneratePageContentTask.js";
import { QueueWbGeneratePageContentUseCase as UseCaseAbstraction } from "./abstractions.js";

class QueueWbGeneratePageContentUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private taskService: TaskService.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // The task calls the AI providers with the project's keys, so anonymous callers can't queue one.
        if (this.identityContext.getIdentity().isAnonymous()) {
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
                writerPersonaId: params.writerPersonaId ?? null,
                additionalFileIds: params.additionalFileIds ?? null
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok({ id: result.value.id });
    }
}

export const QueueWbGeneratePageContentUseCase = UseCaseAbstraction.createImplementation({
    implementation: QueueWbGeneratePageContentUseCaseImpl,
    dependencies: [IdentityContext, TaskService]
});
