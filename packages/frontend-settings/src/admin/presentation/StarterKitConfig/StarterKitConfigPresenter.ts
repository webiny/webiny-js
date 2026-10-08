import { makeAutoObservable } from "mobx";
import { StarterKitConfigPresenter as PresenterAbstraction } from "./abstractions.js";
import { GetFrontendSettingsUseCase } from "~/admin/features/getSettings/abstractions.js";
import { UpdateFrontendSettingsUseCase } from "~/admin/features/updateSettings/abstractions.js";
import { CACHE_KEY } from "~/admin/features/settingsCache.js";
import { settingsCache } from "~/admin/features/settingsCache.js";
import { isValidFrontendDomain } from "~/shared/isValidFrontendDomain.js";
import type { IFrontendSettings } from "~/shared/types.js";
import type { IStarterKit } from "~/shared/types.js";

class StarterKitConfigPresenterImpl implements PresenterAbstraction.Interface {
    private loading = false;
    private saving = false;
    private domain = "";
    private starterKits: IStarterKit[] = [];

    constructor(
        private getSettings: GetFrontendSettingsUseCase.Interface,
        private updateSettings: UpdateFrontendSettingsUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm(): PresenterAbstraction.ViewModel {
        const domainError = this.domainError;

        return {
            loading: this.loading,
            saving: this.saving,
            canSave: !this.loading && !this.saving && domainError === null,
            domain: this.domain,
            domainError,
            starterKits: this.starterKits
        };
    }

    init(): void {
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.getSettings
            .execute()
            .then(settings => this.onLoaded(settings))
            .catch(() => this.onLoadFailed());
    }

    setDomain(domain: string): void {
        this.domain = domain;
    }

    async save(): Promise<PresenterAbstraction.SaveResult> {
        this.saving = true;
        try {
            await this.updateSettings.execute({ domain: this.domain });
            settingsCache.set(CACHE_KEY, {
                domain: this.domain,
                starterKits: this.starterKits
            });
            return { saved: true };
        } catch (error) {
            return { saved: false, message: (error as Error).message };
        } finally {
            this.onSaveFinished();
        }
    }

    private get domainError(): string | null {
        if (isValidFrontendDomain(this.domain)) {
            return null;
        }
        return "Enter an http:// or https:// URL.";
    }

    private onLoaded(settings: IFrontendSettings): void {
        this.domain = settings.domain;
        this.starterKits = settings.starterKits ?? [];
        this.loading = false;
    }

    private onLoadFailed(): void {
        this.loading = false;
    }

    private onSaveFinished(): void {
        this.saving = false;
    }
}

export const StarterKitConfigPresenter = PresenterAbstraction.createImplementation({
    implementation: StarterKitConfigPresenterImpl,
    dependencies: [GetFrontendSettingsUseCase, UpdateFrontendSettingsUseCase]
});
