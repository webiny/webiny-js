import type { DeleteWbPageParams } from "~/page/page.types";

export interface IDeletePage {
    execute: (params: DeleteWbPageParams) => Promise<void>;
}
