export interface UnpublishPageParams {
    id: string;
}

export interface IUnpublishPageUseCase {
    execute: (params: UnpublishPageParams) => Promise<void>;
}
