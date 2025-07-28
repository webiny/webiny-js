import type { MoveWbPageParams } from "~/context/pages/pages.types";

export interface IMovePage {
    execute: (params: MoveWbPageParams) => Promise<void>;
}
