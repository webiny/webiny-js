import { createAbstraction } from "@webiny/feature/api";
import type { HeadlessCmsExport, HeadlessCmsImport } from "./types.js";

export const CmsExport = createAbstraction<HeadlessCmsExport>("CmsExport");

export namespace CmsExport {
    export type Interface = HeadlessCmsExport;
}

export const CmsImport = createAbstraction<HeadlessCmsImport>("CmsImport");

export namespace CmsImport {
    export type Interface = HeadlessCmsImport;
}
