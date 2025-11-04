import { makeAutoObservable, runInAction, toJS } from "mobx";
import { createImplementation } from "@webiny/di";
import {
    SystemInstallerPresenter as Abstraction,
    InstallationInput,
    SystemInstallerRepository,
    type SystemInstallerViewModel,
    type WizardStep,
    type WizardStepState
} from "./abstractions.js";
import { TelemetryService } from "~/features/telemetry/index.js";

const WIZARD_STEPS: WizardStep[] = [
    { name: "introduction", label: "Introduction" },
    { name: "basic-info", label: "Basic info" },
    { name: "admin-account", label: "Admin account" },
    { name: "finish", label: "Finish setup" }
];

class SystemInstallerPresenterImpl implements Abstraction.Interface {
    private loading = true;
    private isInstalled = false;
    private currentStep = 0;
    private error: Error | undefined = undefined;
    private installing = false;
    private startUsing = false;
    private installerData: Record<string, any> = {};

    constructor(
        private telemetry: TelemetryService.Interface,
        private repository: SystemInstallerRepository.Interface
    ) {
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
                this.startUsing = isInstalled;
                this.loading = false;
            });

            if (!isInstalled) {
                await this.telemetry.sendEvent("install-wizard-start");
            }
        } catch {
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    get vm(): SystemInstallerViewModel {
        return {
            error: this.error,
            loading: this.loading,
            isInstalled: this.isInstalled,
            startUsing: this.startUsing,
            currentStep: WIZARD_STEPS[this.currentStep].name,
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

    nextStep = (data: Record<string, any> = {}): void => {
        if (this.currentStep < WIZARD_STEPS.length - 1) {
            Object.assign(this.installerData, data ?? {});
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
        runInAction(() => {
            this.installing = true;
        });
        try {
            const { basicInfo, ...installerData } = toJS(this.installerData);
            const installationInput: InstallationInput = Object.keys(installerData).map(key => {
                return {
                    app: key,
                    data: installerData[key]
                };
            });
            await this.repository.installSystem(installationInput);

            await this.telemetry.sendEvent("install-wizard-end", {
                project: basicInfo.projectName,
                organization: basicInfo.organizationName,
                referralSource: basicInfo.referralSource
            });

            runInAction(() => {
                this.isInstalled = true;
                this.installing = false;
            });
        } catch (error) {
            runInAction(() => {
                this.error = error;
                this.installing = false;
            });
        }
    };

    finishInstallation = () => {
        this.startUsing = true;
    };
}

export const SystemInstallerPresenter = createImplementation({
    abstraction: Abstraction,
    implementation: SystemInstallerPresenterImpl,
    dependencies: [TelemetryService, SystemInstallerRepository]
});
