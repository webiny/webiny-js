import type { MoveWbPageParams, WbPage } from "~/page/page.types";

export interface IMovePage {
    execute: (params: MoveWbPageParams) => Promise<WbPage>;
}
