import { PageGatewayDto } from "./PageGatewayDto.js";
import type { WbListMeta } from "~/types.js";

export interface ListPagesGatewayParams {
    folderId: string;
}

export interface ListPagesGatewayResponse {
    pages: PageGatewayDto[];
    meta: WbListMeta;
}

export interface IListPagesGateway {
    execute: (params: ListPagesGatewayParams) => Promise<ListPagesGatewayResponse>;
}
