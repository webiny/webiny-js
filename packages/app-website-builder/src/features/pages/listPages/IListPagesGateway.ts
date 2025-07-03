import { PageGqlDto } from "./PageGqlDto.js";
import type { WbListMeta } from "~/types.js";

export interface ListPagesGatewayParams {
    folderId: string;
}

export interface ListPagesGatewayResponse {
    pages: PageGqlDto[];
    meta: WbListMeta;
}

export interface IListPagesGateway {
    execute: (params: ListPagesGatewayParams) => Promise<ListPagesGatewayResponse>;
}
