import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface DuplicatePageParams {
    id: string;
}

export interface IDuplicatePageUseCase {
    execute(params: DuplicatePageParams): Promise<void>;
}

export const DuplicatePageUseCase = createAbstraction<IDuplicatePageUseCase>(
    "WebsiteBuilder/DuplicatePageUseCase"
);
export namespace DuplicatePageUseCase {
    export type Interface = IDuplicatePageUseCase;
    export type Params = DuplicatePageParams;
}

export interface IDuplicatePageRepository {
    execute(page: Page): Promise<void>;
}

export const DuplicatePageRepository = createAbstraction<IDuplicatePageRepository>(
    "WebsiteBuilder/DuplicatePageRepository"
);
export namespace DuplicatePageRepository {
    export type Interface = IDuplicatePageRepository;
}

export interface IDuplicatePageGateway {
    execute(id: string): Promise<PageGatewayDto>;
}

export const DuplicatePageGateway = createAbstraction<IDuplicatePageGateway>(
    "WebsiteBuilder/DuplicatePageGateway"
);
export namespace DuplicatePageGateway {
    export type Interface = IDuplicatePageGateway;
}
