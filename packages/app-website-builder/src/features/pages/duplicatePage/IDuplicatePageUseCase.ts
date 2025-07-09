export interface DuplicatePageParams {
    id: string;
}

export interface IDuplicatePageUseCase {
    execute: (params: DuplicatePageParams) => Promise<void>;
}
