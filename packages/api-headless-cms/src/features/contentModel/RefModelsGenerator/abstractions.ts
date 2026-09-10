import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export interface RefModelMetadata {
    valuesSelection: string;
}

export interface IRefModelsGenerator {
    generate(model: CmsModel): Promise<Record<string, RefModelMetadata>>;
}

export const RefModelsGenerator = createAbstraction<IRefModelsGenerator>("RefModelsGenerator");

export namespace RefModelsGenerator {
    export type Interface = IRefModelsGenerator;
}
