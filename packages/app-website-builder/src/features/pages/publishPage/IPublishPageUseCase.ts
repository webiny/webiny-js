export interface PublishPageParams {
    id: string;
    entryId: string;
}

export interface IPublishPageUseCase {
    execute: (params: PublishPageParams) => Promise<void>;
}
