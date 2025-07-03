import { PageDto } from "./PageDto.js";
import { PageGqlDto } from "./PageGqlDto.js";

export interface ICreatePageGateway {
    execute: (pageDto: PageDto) => Promise<PageGqlDto>;
}
