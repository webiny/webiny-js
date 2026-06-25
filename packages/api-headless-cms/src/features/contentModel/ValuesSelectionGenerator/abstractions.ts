import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export interface IValuesSelectionGenerator {
    generate(model: CmsModel): string;
}

export const ValuesSelectionGenerator = createAbstraction<IValuesSelectionGenerator>(
    "ValuesSelectionGenerator"
);

export namespace ValuesSelectionGenerator {
    export type Interface = IValuesSelectionGenerator;
}
