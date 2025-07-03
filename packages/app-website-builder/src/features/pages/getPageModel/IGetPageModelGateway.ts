import { PageModelDto } from "./PageModelDto.js";

export interface IGetPageModelGateway {
    execute: () => Promise<PageModelDto>;
}
