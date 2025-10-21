import { makeAutoObservable, runInAction } from "mobx";
import { createImplementation } from "@webiny/di-container";
import {
    SystemInstallerPresenter as Abstraction,
    SystemInstallerRepository,
    type SystemInstallerViewModel,
    type WizardStep, type WizardStepState
} from "./abstractions.js";

const WIZARD_STEPS: WizardStep[] = [
    {
        name: "introduction",
        label: "Introduction"
    },
    { name: "basic-info", label: "Basic Info" },
    { name: "admin-account", label: "Admin Account" },
    { name: "finish", label: "Finish" }
];

class SystemInstallerPresenterImpl implements Abstraction.Interface {
    private loading = true;
    private isInstalled = false;
    private currentStep = 0;
    private installing = false;

    constructor(private repository: SystemInstallerRepository.Interface) {
        makeAutoObservable(this, {}, { autoBind: true });
        this.initialize();
    }

    private async initialize(): Promise<void> {
        runInAction(() => {
            this.loading = true;
        });

        try {
            const isInstalled = await this.repository.isSystemInstalled();
            runInAction(() => {
                this.isInstalled = isInstalled;
                this.loading = false;
            });
        } catch (error) {
            console.error("Failed to check if system is installed:", error);
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    get vm(): SystemInstallerViewModel {
        return {
            loading: this.loading,
            isInstalled: this.isInstalled,
            currentStep: this.currentStep,
            steps: WIZARD_STEPS.map((step, index) => {
                let state: WizardStepState = "idle";
                if (index === this.currentStep) {
                    state = "current";
                }

                if (index < this.currentStep) {
                    state = "completed";
                }

                return {
                    ...step,
                    state
                };
            }),
            installing: this.installing
        };
    }

    nextStep = (): void => {
        if (this.currentStep < WIZARD_STEPS.length - 1) {
            this.currentStep++;
        }
    };

    previousStep = (): void => {
        if (this.currentStep > 0) {
            this.currentStep--;
        }
    };

    goToStep = (name: WizardStep["name"]): void => {
        const stepIndex = WIZARD_STEPS.findIndex(step => step.name === name);

        if (stepIndex > -1) {
            this.currentStep = stepIndex;
        }
    };

    installSystem = async (): Promise<void> => {
        this.installing = true;
        try {
            await this.repository.installSystem();
            runInAction(() => {
                this.isInstalled = true;
                this.installing = false;
            });
        } catch (error) {
            console.error("Failed to install system:", error);
            runInAction(() => {
                this.installing = false;
            });
            throw error;
        }
    };
}

export const SystemInstallerPresenter = createImplementation({
    abstraction: Abstraction,
    implementation: SystemInstallerPresenterImpl,
    dependencies: [SystemInstallerRepository]
});
