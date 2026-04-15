import { createAbstraction } from "@webiny/feature/admin";
import type { Page } from "~/domain/Page/Page.js";
import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface CreatePageRevisionFromParams {
    id: string;
}

export interface ICreatePageRevisionFromUseCase {
    execute(params: CreatePageRevisionFromParams): Promise<Page>;
}

export const CreatePageRevisionFromUseCase = createAbstraction<ICreatePageRevisionFromUseCase>(
    "WebsiteBuilder/CreatePageRevisionFromUseCase"
);
export namespace CreatePageRevisionFromUseCase {
    export type Interface = ICreatePageRevisionFromUseCase;
    export type Params = CreatePageRevisionFromParams;
}

export interface ICreatePageRevisionFromRepository {
    execute(page: Page): Promise<Page>;
}

export const CreatePageRevisionFromRepository =
    createAbstraction<ICreatePageRevisionFromRepository>(
        "WebsiteBuilder/CreatePageRevisionFromRepository"
    );
export namespace CreatePageRevisionFromRepository {
    export type Interface = ICreatePageRevisionFromRepository;
}

export interface ICreatePageRevisionFromGateway {
    execute(id: string): Promise<PageGatewayDto>;
}

export const CreatePageRevisionFromGateway = createAbstraction<ICreatePageRevisionFromGateway>(
    "WebsiteBuilder/CreatePageRevisionFromGateway"
);
export namespace CreatePageRevisionFromGateway {
    export type Interface = ICreatePageRevisionFromGateway;
}
