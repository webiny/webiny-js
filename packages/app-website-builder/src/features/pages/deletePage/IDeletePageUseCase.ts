export interface DeletePageParams {
    id: string;
    entryId: string;
}

export interface IDeletePageUseCase {
    execute: (params: DeletePageParams) => Promise<void>;
}
