import type { PageGatewayDto } from "./PageGatewayDto.js";

export interface IUnpublishPageGateway {
    execute: (id: string) => Promise<PageGatewayDto>;
}
