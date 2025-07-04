export interface DuplicatePageParams {
    id: string;
    entryId: string;
}

export interface IDuplicatePageUseCase {
    execute: (params: DuplicatePageParams) => Promise<void>;
}
