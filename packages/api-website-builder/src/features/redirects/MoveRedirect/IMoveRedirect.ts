import type { MoveWbRedirectParams } from "~/context/redirects/redirects.types";

export interface IMoveRedirect {
    execute: (params: MoveWbRedirectParams) => Promise<void>;
}
