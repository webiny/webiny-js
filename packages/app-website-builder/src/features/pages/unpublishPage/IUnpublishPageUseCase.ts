export interface UnpublishPageParams {
    id: string;
    entryId: string;
}

export interface IUnpublishPageUseCase {
    execute: (params: UnpublishPageParams) => Promise<void>;
}
