export interface CreatePageRevisionFromParams {
    id: string;
}

export interface ICreatePageRevisionFromUseCase {
    execute: (params: CreatePageRevisionFromParams) => Promise<void>;
}
