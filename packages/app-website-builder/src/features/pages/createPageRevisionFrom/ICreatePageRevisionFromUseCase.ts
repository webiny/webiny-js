export interface CreatePageRevisionFromParams {
    id: string;
    entryId: string;
}

export interface ICreatePageRevisionFromUseCase {
    execute: (params: CreatePageRevisionFromParams) => Promise<void>;
}
