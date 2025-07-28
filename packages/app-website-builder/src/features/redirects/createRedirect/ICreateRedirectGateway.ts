import { RedirectDto } from "./RedirectDto.js";
import { RedirectGqlDto } from "./RedirectGqlDto.js";

export interface ICreateRedirectGateway {
    execute: (pageDto: RedirectDto) => Promise<RedirectGqlDto>;
}
