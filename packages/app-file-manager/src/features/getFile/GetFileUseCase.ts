import {
    GetFileUseCase as UseCaseAbstraction,
    GetFileRepository,
    type GetFileUseCaseParams,
    type GetFileUseCaseResult
} from "./abstractions.js";

class GetFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetFileRepository.Interface) {}

    async execute(params: GetFileUseCaseParams): Promise<GetFileUseCaseResult> {
        try {
            const file = await this.repository.execute({ id: params.id });
            return { success: true, file };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return { success: false, error: { code: "GET_FILE_ERROR", message } };
        }
    }
}

export const GetFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFileUseCaseImpl,
    dependencies: [GetFileRepository]
});
