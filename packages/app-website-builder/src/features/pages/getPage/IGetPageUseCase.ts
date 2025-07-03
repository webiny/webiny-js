export interface GetPageParams {
    id: string;
}

export interface IGetPageUseCase {
    execute: (params: GetPageParams) => Promise<void>;
}
