import { createAbstraction } from "@webiny/feature/admin";
import type { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import type { PageRevisionGatewayDto } from "./PageRevisionGatewayDto.js";

export interface GetPageRevisionsParams {
    entryId: string;
}

export interface IGetPageRevisionsUseCase {
    execute(params: GetPageRevisionsParams): Promise<PageRevision[]>;
}

export const GetPageRevisionsUseCase = createAbstraction<IGetPageRevisionsUseCase>(
    "WebsiteBuilder/GetPageRevisionsUseCase"
);
export namespace GetPageRevisionsUseCase {
    export type Interface = IGetPageRevisionsUseCase;
    export type Params = GetPageRevisionsParams;
}

export interface IGetPageRevisionsRepository {
    execute(pageId: string): Promise<PageRevision[]>;
}

export const GetPageRevisionsRepository = createAbstraction<IGetPageRevisionsRepository>(
    "WebsiteBuilder/GetPageRevisionsRepository"
);
export namespace GetPageRevisionsRepository {
    export type Interface = IGetPageRevisionsRepository;
}

export interface IGetPageRevisionsGateway {
    execute(pageId: string): Promise<PageRevisionGatewayDto[]>;
}

export const GetPageRevisionsGateway = createAbstraction<IGetPageRevisionsGateway>(
    "WebsiteBuilder/GetPageRevisionsGateway"
);
export namespace GetPageRevisionsGateway {
    export type Interface = IGetPageRevisionsGateway;
}
