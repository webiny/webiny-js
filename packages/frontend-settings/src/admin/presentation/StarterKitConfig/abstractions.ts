import { createAbstraction } from "@webiny/feature/admin";
import type { IStarterKit } from "~/shared/types.js";

export interface IStarterKitConfigVm {
    loading: boolean;
    saving: boolean;
    canSave: boolean;
    domain: string;
    starterKits: IStarterKit[];
}

export interface IStarterKitConfigPresenter {
    vm: IStarterKitConfigVm;
    init(): void;
    setDomain(domain: string): void;
    save(): Promise<void>;
}

export const StarterKitConfigPresenter = createAbstraction<IStarterKitConfigPresenter>(
    "FrontendSettings/StarterKitConfigPresenter"
);

export namespace StarterKitConfigPresenter {
    export type Interface = IStarterKitConfigPresenter;
    export type ViewModel = IStarterKitConfigVm;
}
