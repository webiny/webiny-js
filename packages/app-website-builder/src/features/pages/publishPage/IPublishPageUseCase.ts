export interface PublishPageParams {
    id: string;
}

export interface IPublishPageUseCase {
    execute: (params: PublishPageParams) => Promise<void>;
}
