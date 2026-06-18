import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettingsValues } from "~/types.js";

export interface IDisableIndexing {
    exec(index: string): Promise<IIndexSettingsValues>;
}

export const DisableIndexing = createAbstraction<IDisableIndexing>(
    "ElasticsearchTasks/DisableIndexing"
);

export namespace DisableIndexing {
    export type Interface = IDisableIndexing;
}
