import type { DeleteWbRedirectParams } from "~/context/redirects/redirects.types";

export interface IDeleteRedirect {
    execute: (params: DeleteWbRedirectParams) => Promise<void>;
}
