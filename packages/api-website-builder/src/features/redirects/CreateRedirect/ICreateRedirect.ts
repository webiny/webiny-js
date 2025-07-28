import type { CreateWbRedirectData, WbRedirect } from "~/context/redirects/redirects.types";

export interface ICreateRedirect {
    execute: (data: CreateWbRedirectData) => Promise<WbRedirect>;
}
