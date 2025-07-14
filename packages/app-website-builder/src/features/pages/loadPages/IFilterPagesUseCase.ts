export interface FilterPagesUseCaseParams {
    filters: Record<string, any>;
    folderIds: string[];
}

export interface IFilterPagesUseCase {
    execute: (params: FilterPagesUseCaseParams) => Promise<void>;
}
