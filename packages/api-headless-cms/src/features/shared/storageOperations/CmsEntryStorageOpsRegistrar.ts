import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";

export interface ICmsEntryStorageOpsRegistrar {
    register(container: Container): void;
}

export const CmsEntryStorageOpsRegistrar =
    createAbstraction<ICmsEntryStorageOpsRegistrar>("Cms/EntryStorageOpsRegistrar");

export namespace CmsEntryStorageOpsRegistrar {
    export type Interface = ICmsEntryStorageOpsRegistrar;
}
