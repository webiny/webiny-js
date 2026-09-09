import { makeAutoObservable, runInAction } from "mobx";
import { StarterKitConfigPresenter as PresenterAbstraction } from "./abstractions.js";
import { GetFrontendSettingsUseCase } from "~/admin/features/getSettings/abstractions.js";
import { UpdateFrontendSettingsUseCase } from "~/admin/features/updateSettings/abstractions.js";

class StarterKitConfigPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;
    private saving = false;
    private initialized = false;
    private domain = "";
    private starterKits: import("~/shared/types.js").IStarterKit[] = [];

    constructor(
        private getSettings: GetFrontendSettingsUseCase.Interface,
        private updateSettings: UpdateFrontendSettingsUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        return {
            loading: this.loading,
            saving: this.saving,
            domain: this.domain,
            starterKits: this.starterKits
        };
    }

    init(): void {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.loading = true;
        this.getSettings
            .execute()
            .then(settings => {
                runInAction(() => {
                    this.domain = settings.domain;
                    this.starterKits = settings.starterKits ?? [];
                    this.loading = false;
                });
            })
            .catch(() => {
                runInAction(() => {
                    this.loading = false;
                    this.initialized = false;
                });
            });
    }

    setDomain(domain: string): void {
        this.domain = domain;
    }

    async save(): Promise<void> {
        this.saving = true;
        try {
            await this.updateSettings.execute({ domain: this.domain });
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }
}

export const StarterKitConfigPresenter = PresenterAbstraction.createImplementation({
    implementation: StarterKitConfigPresenterImpl,
    dependencies: [GetFrontendSettingsUseCase, UpdateFrontendSettingsUseCase]
});
