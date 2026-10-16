import { createAbstraction } from "@webiny/feature/admin";
import type { IStarterKit } from "~/shared/types.js";

export interface IStarterKitConfigVm {
    loading: boolean;
    saving: boolean;
    canSave: boolean;
    domain: string;
    /**
     * Set when the domain isn't something a preview iframe can load.
     */
    domainError: string | null;
    starterKits: IStarterKit[];
}

export type StarterKitConfigSaveResult = { saved: true } | { saved: false; message: string };

export interface IStarterKitConfigPresenter {
    vm: IStarterKitConfigVm;
    /**
     * Loads the stored settings. Called every time the dialog opens, so an edit that was closed
     * without saving doesn't come back.
     */
    init(): void;
    setDomain(domain: string): void;
    save(): Promise<StarterKitConfigSaveResult>;
}

export const StarterKitConfigPresenter = createAbstraction<IStarterKitConfigPresenter>(
    "FrontendSettings/StarterKitConfigPresenter"
);

export namespace StarterKitConfigPresenter {
    export type Interface = IStarterKitConfigPresenter;
    export type ViewModel = IStarterKitConfigVm;
    export type SaveResult = StarterKitConfigSaveResult;
}
