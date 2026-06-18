import { createAbstraction } from "@webiny/feature/api";
import type { IIndexSettingsValues } from "~/types.js";

export interface IEnableIndexing {
    exec(index: string, settings: IIndexSettingsValues): Promise<void>;
}

export const EnableIndexing = createAbstraction<IEnableIndexing>(
    "ElasticsearchTasks/EnableIndexing"
);

export namespace EnableIndexing {
    export type Interface = IEnableIndexing;
}
