import type { PageGatewayDto } from "./PageGatewayDto.js";

export interface IMovePageGateway {
    execute: (id: string, folderId: string) => Promise<PageGatewayDto>;
}
