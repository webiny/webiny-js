import type { IImportFromUrlUseCaseExecuteResponse } from "~/crud/useCases";

export interface IAbortImportFromUrlUseCaseExecuteParams {
    id: string;
}

export interface IAbortImportFromUrlUseCase {
    execute: (
        params: IAbortImportFromUrlUseCaseExecuteParams
    ) => Promise<IImportFromUrlUseCaseExecuteResponse>;
}
