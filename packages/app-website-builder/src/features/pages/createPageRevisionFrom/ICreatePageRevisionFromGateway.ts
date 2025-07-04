import type { PageGatewayDto } from "./PageGatewayDto.js";

export interface ICreatePageRevisionFromGateway {
    execute: (id: string) => Promise<PageGatewayDto>;
}
