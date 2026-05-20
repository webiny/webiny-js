import {
    UpdateFileUseCase as UseCaseAbstraction,
    UpdateFileRepository,
    type UpdateFileUseCaseParams,
    type UpdateFileUseCaseResult
} from "./abstractions.js";
import { FILE_FIELDS } from "~/features/shared/FILE_FIELDS.js";

class UpdateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateFileRepository.Interface) {}

    async execute(params: UpdateFileUseCaseParams): Promise<UpdateFileUseCaseResult> {
        try {
            const file = await this.repository.execute({
                id: params.id,
                data: params.data,
                fields: FILE_FIELDS
            });
            return { success: true, file };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { success: false, error: { code: "UPDATE_FILE_ERROR", message } };
        }
    }
}

export const UpdateFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateFileUseCaseImpl,
    dependencies: [UpdateFileRepository]
});
