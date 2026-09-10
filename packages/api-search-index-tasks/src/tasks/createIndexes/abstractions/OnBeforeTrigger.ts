import { createAbstraction } from "@webiny/feature/api";
import type { IIndexManager } from "~/abstractions/IndexManager.js";

export interface IOnBeforeTrigger {
    run(targets: string[] | undefined, indexManager: IIndexManager): Promise<void>;
}

export const OnBeforeTrigger = createAbstraction<IOnBeforeTrigger>(
    "SearchIndexTasks/OnBeforeTrigger"
);

export namespace OnBeforeTrigger {
    export type Interface = IOnBeforeTrigger;
}
