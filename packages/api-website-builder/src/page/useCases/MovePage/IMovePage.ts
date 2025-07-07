import type { MoveWbPageParams } from "~/page/page.types";

export interface IMovePage {
    execute: (params: MoveWbPageParams) => Promise<void>;
}
