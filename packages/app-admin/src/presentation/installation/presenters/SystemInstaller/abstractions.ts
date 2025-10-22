import { Abstraction } from "@webiny/di-container";

export type InstallationInput = Array<{ app: string; data: Record<string, any> }>;

export interface ISystemInstallerGateway {
    isSystemInstalled(): Promise<boolean>;
    installSystem(data: InstallationInput): Promise<void>;
}

export const SystemInstallerGateway = new Abstraction<ISystemInstallerGateway>(
    "SystemInstallerGateway"
);

export namespace SystemInstallerGateway {
    export type Interface = ISystemInstallerGateway;
}

export interface ISystemInstallerRepository {
    isSystemInstalled(): Promise<boolean>;
    installSystem(data: InstallationInput): Promise<void>;
}

export const SystemInstallerRepository = new Abstraction<ISystemInstallerRepository>(
    "SystemInstallerRepository"
);

export namespace SystemInstallerRepository {
    export type Interface = ISystemInstallerRepository;
}

export type WizardStep = {
    name: "introduction" | "basic-info" | "admin-account" | "finish";
    label: string;
};

export type WizardStepState = "current" | "idle" | "completed";

export interface SystemInstallerViewModel {
    error: Error | undefined;
    loading: boolean;
    isInstalled: boolean;
    startUsing: boolean;
    currentStep: WizardStep["name"];
    steps: Array<WizardStep & { state: WizardStepState }>;
    installing: boolean;
}

export interface ISystemInstallerPresenter {
    vm: SystemInstallerViewModel;
    nextStep(data?: Record<string, any>): void;
    previousStep(): void;
    goToStep(step: WizardStep["name"]): void;
    installSystem(): Promise<void>;
    finishInstallation(): void;
}

export const SystemInstallerPresenter = new Abstraction<ISystemInstallerPresenter>(
    "SystemInstallerPresenter"
);

export namespace SystemInstallerPresenter {
    export type Interface = ISystemInstallerPresenter;
    export type ViewModel = SystemInstallerViewModel;
}
