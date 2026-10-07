import { createAbstraction } from "@webiny/feature/api";
import type { IStarterKit } from "~/shared/types.js";

export interface IStarterKitsProvider {
    execute(): Promise<IStarterKit[]>;
}

export const StarterKitsProvider = createAbstraction<IStarterKitsProvider>(
    "FrontendSettings/StarterKitsProvider"
);

export namespace StarterKitsProvider {
    export type Interface = IStarterKitsProvider;
}
