export interface DeleteRedirectParams {
    id: string;
}

export interface IDeleteRedirectUseCase {
    execute: (params: DeleteRedirectParams) => Promise<void>;
}
