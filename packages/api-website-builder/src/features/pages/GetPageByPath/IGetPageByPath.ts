import type { WbPage } from "~/context/pages/pages.types";

export interface IGetPageByPath {
    execute: (path: string) => Promise<WbPage | null>;
}
