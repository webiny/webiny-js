import type { WbPage } from "~/context/pages/pages.types";

export interface IGetPageById {
    execute: (id: string) => Promise<WbPage | null>;
}
