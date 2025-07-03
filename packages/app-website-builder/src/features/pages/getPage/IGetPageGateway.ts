import type { PageGatewayDto } from "~/features/pages/getPage/PageGatewayDto.js";

export interface IGetPageGateway {
    execute: (id: string) => Promise<PageGatewayDto>;
}
