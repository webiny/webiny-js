import type { PageGatewayDto } from "./PageGatewayDto.js";

export interface IPublishPageGateway {
    execute: (id: string) => Promise<PageGatewayDto>;
}
