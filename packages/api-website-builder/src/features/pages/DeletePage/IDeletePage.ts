import type { DeleteWbPageParams } from "~/context/pages/pages.types";

export interface IDeletePage {
    execute: (params: DeleteWbPageParams) => Promise<void>;
}
