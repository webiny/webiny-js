import { RedirectDto } from "./RedirectDto.js";
import { RedirectGqlDto } from "./RedirectGqlDto.js";

export interface IUpdateRedirectGateway {
    execute: (redirect: RedirectDto) => Promise<RedirectGqlDto>;
}
