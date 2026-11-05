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

export default QueueWbGeneratePageContentUseCase.createImplementation({
    implementation: QueueWbGeneratePageContentUseCaseImpl,
    dependencies: [IdentityContext, TaskService]
});
