import type { WbPage } from "~/context/pages/pages.types";

export interface IGetPageRevisions {
    execute: (pageId: string) => Promise<WbPage[]>;
}
