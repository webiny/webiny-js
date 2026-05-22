import { makeAutoObservable, runInAction, toJS } from "mobx";
import { createImplementation } from "@webiny/di";
import {
    SystemInstallerPresenter as Abstraction,
    InstallationInput,
    SystemInstallerRepository,
    type SystemInstallerViewModel,
    type WizardStep,
    type WizardStepState,
    type ErrorObject
} from "./abstractions.js";
import { TelemetryService } from "~/features/telemetry/index.js";

class SystemInstallerPresenterImpl implements Abstraction.Interface {
    private loading = true;
    private isInstalled = false;
    private currentStep = 0;
    private error: ErrorObject | undefined = undefined;
    private installing = false;
    private startUsing = false;
    private installerData: Record<string, any> = {};
    private wizardSteps: WizardStep[];

    constructor(
        private telemetry: TelemetryService.Interface,
        private repository: SystemInstallerRepository.Interface
    ) {
        // TODO: Wizard steps need to be implemented via plugins, but this will do for now.
        this.wizardSteps = [
            { name: "introduction", label: "Introduction" },
            { name: "basic-info", label: "Basic info" },
            process.env.REACT_APP_IDP_TYPE === "cognito"
                ? { name: "admin-account", label: "Admin account" }
                : undefined,
            { name: "finish", label: "Finish setup" }
        ].filter(Boolean) as WizardStep[];

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
            currentStep: this.wizardSteps[this.currentStep].name,
            steps: this.wizardSteps.map((step, index) => {
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
        if (this.currentStep < this.wizardSteps.length - 1) {
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
        const stepIndex = this.wizardSteps.findIndex(step => step.name === name);

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

            // ToS acceptance in the basic-info step covers consent. Fire-and-forget
            // so a slow/failed newsletter call never blocks the wizard.
            void this.subscribeToNewsletter(installerData.Cognito);
        } catch (error) {
            runInAction(() => {
                this.error = error;
                this.installing = false;
                console.log("error", error);
            });
        }
    };

    private async subscribeToNewsletter(cognito: any): Promise<void> {
        if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
            return;
        }
        if (!cognito?.email || !cognito?.firstName || !cognito?.lastName) {
            return;
        }

        try {
            await fetch("https://t.webiny.com/newsletter", {
                method: "POST",
                // text/plain keeps the request CORS-simple (no preflight), matching
                // the /event convention. The server parses the body as JSON regardless.
                headers: { "Content-Type": "text/plain;charset=UTF-8" },
                body: JSON.stringify({
                    firstName: cognito.firstName,
                    lastName: cognito.lastName,
                    email: cognito.email,
                    source: "install-wizard"
                })
            });
        } catch {
            // Best-effort: never surface to the user.
        }
    }

    finishInstallation = () => {
        this.startUsing = true;
    };
}

export const SystemInstallerPresenter = createImplementation({
    abstraction: Abstraction,
    implementation: SystemInstallerPresenterImpl,
    dependencies: [TelemetryService, SystemInstallerRepository]
});
