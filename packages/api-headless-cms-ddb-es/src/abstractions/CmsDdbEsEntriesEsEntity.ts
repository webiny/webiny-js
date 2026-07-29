import { createAbstraction } from "@webiny/feature/api";
import type { IOpenSearchEntity } from "@webiny/api-opensearch";

export const CmsDdbEsEntriesEsEntity = createAbstraction<IOpenSearchEntity>(
    "Cms/DdbEs/EntriesEsEntity"
);

export namespace CmsDdbEsEntriesEsEntity {
    export type Interface = IOpenSearchEntity;
}
