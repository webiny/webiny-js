export interface ListPagesUseCaseParams {
    where?: {
        [key: string]: any;
    };
    sort?: string[];
    limit?: number;
    after?: string;
    search?: string;
}

export interface IListPagesUseCase {
    execute: (params?: ListPagesUseCaseParams) => Promise<void>;
}
