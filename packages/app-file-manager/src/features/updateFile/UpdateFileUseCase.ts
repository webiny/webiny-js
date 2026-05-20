import { FileFieldsProvider } from "../shared/abstractions.js";
import {
    UpdateFileUseCase as UseCaseAbstraction,
    UpdateFileRepository,
    type UpdateFileUseCaseParams,
    type UpdateFileUseCaseResult
} from "./abstractions.js";

class UpdateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: UpdateFileRepository.Interface,
        private fileFieldsProvider: FileFieldsProvider.Interface
    ) {}

    async execute(params: UpdateFileUseCaseParams): Promise<UpdateFileUseCaseResult> {
        try {
            const fileFields = await this.fileFieldsProvider.execute();
            const file = await this.repository.execute({
                id: params.id,
                data: params.data,
                fields: fileFields
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
    dependencies: [UpdateFileRepository, FileFieldsProvider]
});
