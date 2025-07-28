import type { WbRedirect } from "~/context/redirects/redirects.types";

export interface IGetRedirectById {
    execute: (id: string) => Promise<WbRedirect | null>;
}
