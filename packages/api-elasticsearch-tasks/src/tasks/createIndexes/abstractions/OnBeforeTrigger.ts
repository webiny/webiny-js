import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/settings/types.js";

export interface IOnBeforeTrigger {
    run(targets: string[] | undefined, indexManager: IIndexManager): Promise<void>;
}

export const OnBeforeTrigger = createAbstraction<IOnBeforeTrigger>(
    "ElasticsearchTasks/OnBeforeTrigger"
);

export namespace OnBeforeTrigger {
    export type Interface = IOnBeforeTrigger;
}
