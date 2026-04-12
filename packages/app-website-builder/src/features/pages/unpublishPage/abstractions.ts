import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface UnpublishPageParams {
    id: string;
}

export interface IUnpublishPageUseCase {
    execute(params: UnpublishPageParams): Promise<void>;
}

export const UnpublishPageUseCase = createAbstraction<IUnpublishPageUseCase>(
    "WebsiteBuilder/UnpublishPageUseCase"
);

export namespace UnpublishPageUseCase {
    export type Interface = IUnpublishPageUseCase;
    export type Params = UnpublishPageParams;
}

export interface IUnpublishPageRepository {
    execute(page: Page): Promise<void>;
}

export const UnpublishPageRepository = createAbstraction<IUnpublishPageRepository>(
    "WebsiteBuilder/UnpublishPageRepository"
);

export namespace UnpublishPageRepository {
    export type Interface = IUnpublishPageRepository;
}

export interface IUnpublishPageGateway {
    execute(id: string): Promise<PageGatewayDto>;
}

export const UnpublishPageGateway = createAbstraction<IUnpublishPageGateway>(
    "WebsiteBuilder/UnpublishPageGateway"
);

export namespace UnpublishPageGateway {
    export type Interface = IUnpublishPageGateway;
}
