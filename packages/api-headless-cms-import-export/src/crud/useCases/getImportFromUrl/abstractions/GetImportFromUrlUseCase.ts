import type {
    IImportFromUrlUseCaseExecuteParams,
    IImportFromUrlUseCaseExecuteResponse
} from "~/crud/useCases/importFromUrl/abstractions/ImportFromUrlUseCase";

export interface IGetImportFromUrlUseCase {
    execute(
        params: IImportFromUrlUseCaseExecuteParams
    ): Promise<IImportFromUrlUseCaseExecuteResponse | null>;
}
