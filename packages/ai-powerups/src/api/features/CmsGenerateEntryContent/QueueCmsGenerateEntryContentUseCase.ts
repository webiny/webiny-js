import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import { checkAdditionalFilesAccess } from "~/api/features/AiPromptContext/checkAdditionalFilesAccess.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ModelNotFoundError } from "@webiny/api-headless-cms/domain/contentModel/errors.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { QueueCmsGenerateEntryContentUseCase } from "./abstractions.js";
import {
    CMS_GENERATE_ENTRY_CONTENT_TASK_ID,
    type ICmsGenerateEntryContentTaskInput
} from "./CmsGenerateEntryContentTask.js";

class QueueCmsGenerateEntryContentUseCaseImpl
    implements QueueCmsGenerateEntryContentUseCase.Interface
{
    constructor(
        private identityContext: IdentityContext.Interface,
        private wcp: WcpContext.Interface,
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private taskService: TaskService.Interface,
        private getFile: GetFileUseCase.Interface
    ) {}

    async execute(
        params: QueueCmsGenerateEntryContentUseCase.Params
    ): QueueCmsGenerateEntryContentUseCase.Return {
        // The task calls the AI providers with the project's keys, so anonymous callers can't queue one.
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        // Checked per request, NOT at feature-registration time: the WCP license is loaded per
        // request, so a register-time check reads the placeholder NullLicense (canUse* → false).
        if (!this.wcp.canUseAiEntryGeneration()) {
            return Result.fail(
                new Error(
                    "AI entry generation cannot be used because your project license does not permit it."
                )
            );
        }

        // The task runs without authorization, so access to the model is checked here.
        // Private models are internal, so they are treated as unknown.
        const modelResult = await this.getModel.execute(params.modelId);
        if (modelResult.isFail() || modelResult.value.isPrivate) {
            return Result.fail(new ModelNotFoundError(params.modelId));
        }

        const model = modelResult.value;
        // Generated content is used to fill in an entry, so it needs write access to the model.
        const canWrite = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canWrite) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        const filesResult = await checkAdditionalFilesAccess(
            this.getFile,
            params.additionalFileIds
        );
        if (filesResult.isFail()) {
            return Result.fail(filesResult.error);
        }

        const result = await this.taskService.trigger<ICmsGenerateEntryContentTaskInput>({
            definition: CMS_GENERATE_ENTRY_CONTENT_TASK_ID,
            input: {
                prompt: params.prompt,
                modelId: params.modelId,
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

export default QueueCmsGenerateEntryContentUseCase.createImplementation({
    implementation: QueueCmsGenerateEntryContentUseCaseImpl,
    dependencies: [
        IdentityContext,
        WcpContext,
        GetModelUseCase,
        AccessControl,
        TaskService,
        GetFileUseCase
    ]
});
