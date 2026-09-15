import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    ISimpleCmsEntry,
    IUpdateSimpleEntryInput
} from "~/features/simpleContentEntries/types.js";

export interface IUpdateSimpleEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: ISimpleCmsEntry<TValues>;
    input: IUpdateSimpleEntryInput<TValues>;
}

export interface IUpdateSimpleEntryDataFactory {
    update<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        original: ISimpleCmsEntry<TValues>,
        rawInput: IUpdateSimpleEntryInput<TValues>
    ): Promise<IUpdateSimpleEntryDataResponse<TValues>>;
}

/** Builds the reduced domain entry for an update operation. */
export const UpdateSimpleEntryDataFactory = createAbstraction<IUpdateSimpleEntryDataFactory>(
    "Cms/SimpleEntry/UpdateSimpleEntryDataFactory"
);

export namespace UpdateSimpleEntryDataFactory {
    export type Interface = IUpdateSimpleEntryDataFactory;
    export type Input<TValues extends CmsEntryValues = CmsEntryValues> =
        IUpdateSimpleEntryInput<TValues>;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        IUpdateSimpleEntryDataResponse<TValues>;
}
