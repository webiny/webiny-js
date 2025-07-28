export interface FilterRedirectsUseCaseParams {
    filters: Record<string, any>;
    folderIds: string[];
}

export interface IFilterRedirectsUseCase {
    execute: (params: FilterRedirectsUseCaseParams) => Promise<void>;
}
