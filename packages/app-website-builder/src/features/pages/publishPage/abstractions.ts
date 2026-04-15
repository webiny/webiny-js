import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface PublishPageParams {
    id: string;
}

export interface IPublishPageUseCase {
    execute(params: PublishPageParams): Promise<void>;
}

export const PublishPageUseCase = createAbstraction<IPublishPageUseCase>(
    "WebsiteBuilder/PublishPageUseCase"
);

export namespace PublishPageUseCase {
    export type Interface = IPublishPageUseCase;
    export type Params = PublishPageParams;
}

export interface IPublishPageRepository {
    execute(page: Page): Promise<void>;
}

export const PublishPageRepository = createAbstraction<IPublishPageRepository>(
    "WebsiteBuilder/PublishPageRepository"
);

export namespace PublishPageRepository {
    export type Interface = IPublishPageRepository;
}

export interface IPublishPageGateway {
    execute(id: string): Promise<PageGatewayDto>;
}

export const PublishPageGateway = createAbstraction<IPublishPageGateway>(
    "WebsiteBuilder/PublishPageGateway"
);

export namespace PublishPageGateway {
    export type Interface = IPublishPageGateway;
}
