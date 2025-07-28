import { RedirectGatewayDto } from "./RedirectGatewayDto.js";
import type { WbListMeta } from "~/types.js";

export interface ListRedirectsGatewayParams {
    where: Record<string, any>;
    limit: number;
    sort?: string[];
    after?: string;
    search?: string;
}

export interface ListRedirectsGatewayResponse {
    redirects: RedirectGatewayDto[];
    meta: WbListMeta;
}

export interface IListRedirectsGateway {
    execute: (params: ListRedirectsGatewayParams) => Promise<ListRedirectsGatewayResponse>;
}
