export interface DeletePageParams {
    id: string;
    permanently: boolean;
}

export interface IDeletePageUseCase {
    execute: (params: DeletePageParams) => Promise<void>;
}
