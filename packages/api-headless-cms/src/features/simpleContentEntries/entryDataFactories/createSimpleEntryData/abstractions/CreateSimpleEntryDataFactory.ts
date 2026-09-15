import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryValues, CmsModel } from "~/types/index.js";
import type {
    ICreateSimpleEntryInput,
    ISimpleCmsEntry
} from "~/features/simpleContentEntries/types.js";

export interface ICreateSimpleEntryDataResponse<TValues extends CmsEntryValues = CmsEntryValues> {
    entry: ISimpleCmsEntry<TValues>;
    input: ICreateSimpleEntryInput<TValues>;
}

export interface ICreateSimpleEntryDataFactory {
    create<TValues extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        rawInput: ICreateSimpleEntryInput<TValues>
    ): Promise<ICreateSimpleEntryDataResponse<TValues>>;
}

/** Builds the reduced domain entry for a create operation. */
export const CreateSimpleEntryDataFactory = createAbstraction<ICreateSimpleEntryDataFactory>(
    "Cms/SimpleEntry/CreateSimpleEntryDataFactory"
);

export namespace CreateSimpleEntryDataFactory {
    export type Interface = ICreateSimpleEntryDataFactory;
    export type Input<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateSimpleEntryInput<TValues>;
    export type Response<TValues extends CmsEntryValues = CmsEntryValues> =
        ICreateSimpleEntryDataResponse<TValues>;
}
