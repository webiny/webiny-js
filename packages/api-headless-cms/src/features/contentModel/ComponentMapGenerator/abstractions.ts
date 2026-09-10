import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export interface IComponentMapGenerator {
    generate(model: CmsModel): Record<string, string>;
}

export const ComponentMapGenerator =
    createAbstraction<IComponentMapGenerator>("ComponentMapGenerator");

export namespace ComponentMapGenerator {
    export type Interface = IComponentMapGenerator;
}
