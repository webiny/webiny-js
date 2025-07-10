import { PageGatewayDto } from "./PageGatewayDto.js";
import type { WbListMeta } from "~/types.js";

export interface ListPagesGatewayParams {
    where: Record<string, any>;
    limit: number;
    sort?: string[];
    after?: string;
    search?: string;
}

export interface ListPagesGatewayResponse {
    pages: PageGatewayDto[];
    meta: WbListMeta;
}

export interface IListPagesGateway {
    execute: (params: ListPagesGatewayParams) => Promise<ListPagesGatewayResponse>;
}
