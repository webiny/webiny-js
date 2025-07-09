export interface DeletePageParams {
    id: string;
}

export interface IDeletePageUseCase {
    execute: (params: DeletePageParams) => Promise<void>;
}
