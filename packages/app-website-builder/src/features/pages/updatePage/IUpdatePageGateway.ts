import { PageDto } from "./PageDto.js";
import { PageGqlDto } from "./PageGqlDto.js";

export interface IUpdatePageGateway {
    execute: (page: PageDto) => Promise<PageGqlDto>;
}
