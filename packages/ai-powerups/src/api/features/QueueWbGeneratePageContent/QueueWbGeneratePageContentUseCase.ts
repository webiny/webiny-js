import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { ListFilesUseCase } from "@webiny/api-file-manager/features/file/ListFiles/index.js";
import { MAX_ADDITIONAL_FILES } from "~/api/constants.js";
import {
    WB_GENERATE_PAGE_CONTENT_TASK_ID,
    type IWbGeneratePageContentTaskInput
} from "~/api/features/WbGeneratePageContent/WbGeneratePageContentTask.js";
import { QueueWbGeneratePageContentUseCase as UseCaseAbstraction } from "./abstractions.js";

class QueueWbGeneratePageContentUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private wbPermissions: WbPermissions.Interface,
        private listFiles: ListFilesUseCase.Interface,
        private taskService: TaskService.Interface
    ) {}

    public async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // The task calls the AI providers with the project's keys, so anonymous callers can't queue one.
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        // The task runs without authorization; generated content is used to edit a page.
        if (!(await this.wbPermissions.canEdit("page"))) {
            return Result.fail(new NotAuthorizedError());
        }

        // The task reads the additional files without authorization, so only the files the caller
        // can list (File Manager permissions, own records, folder level permissions) are passed on.
        // When the caller can't list files at all, the generation runs without them.
        const requestedFileIds = [...new Set(params.additionalFileIds ?? [])].slice(
            0,
            MAX_ADDITIONAL_FILES
        );
        let additionalFileIds: string[] | null = null;
        if (requestedFileIds.length > 0) {
            const filesResult = await this.listFiles.execute({
                where: { entryId_in: requestedFileIds },
                limit: requestedFileIds.length
            });
            if (filesResult.isOk()) {
                const readableIds = new Set(filesResult.value.items.map(file => file.id));
                additionalFileIds = requestedFileIds.filter(id => readableIds.has(id));
            }
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
                additionalFileIds
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
    dependencies: [IdentityContext, WbPermissions, ListFilesUseCase, TaskService]
});
