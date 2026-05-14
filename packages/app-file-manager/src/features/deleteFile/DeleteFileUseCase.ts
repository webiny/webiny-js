import {
    DeleteFileUseCase as UseCaseAbstraction,
    DeleteFileRepository,
    type DeleteFileUseCaseParams,
    type DeleteFileUseCaseResult
} from "./abstractions.js";

class DeleteFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteFileRepository.Interface) {}

    async execute(params: DeleteFileUseCaseParams): Promise<DeleteFileUseCaseResult> {
        try {
            await this.repository.execute({ id: params.id });
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { success: false, error: { code: "DELETE_FILE_ERROR", message } };
        }
    }
}

export const DeleteFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteFileUseCaseImpl,
    dependencies: [DeleteFileRepository]
});
