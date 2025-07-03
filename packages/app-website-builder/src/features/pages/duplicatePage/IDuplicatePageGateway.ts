import type { PageGatewayDto } from "./PageGatewayDto.js";

export interface IDuplicatePageGateway {
    execute: (id: string) => Promise<PageGatewayDto>;
}
