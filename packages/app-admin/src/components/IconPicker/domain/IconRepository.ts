import cloneDeep from "lodash/cloneDeep";
import { makeAutoObservable, runInAction } from "mobx";

import { Loading } from "../domain";
import { IconPackProviderInterface as IconPackProvider } from "~/components/IconPicker/config";
import { ProviderIcon } from "~/components/IconPicker/config/IconPackProvider";

export class IconRepository {
    private loading: Loading;
    private icons: ProviderIcon[] = [];
    public iconPackProviders: IconPackProvider[];

    constructor(iconPackProviders: IconPackProvider[]) {
        this.loading = new Loading(true);
        this.iconPackProviders = iconPackProviders;
        makeAutoObservable(this);
    }

    async loadIcons() {
        if (this.icons.length > 0) {
            return;
        }

        const iconPacks = await this.runWithLoading<ProviderIcon[][]>(
            Promise.all(this.iconPackProviders.map(provider => provider.getIcons()))
        );

        runInAction(() => {
            this.icons = iconPacks?.flat() || [];
        });
    }

    getIcons() {
        return cloneDeep(this.icons);
    }

    getLoading() {
        return {
            isLoading: this.loading.isLoading,
            loadingLabel: this.loading.loadingLabel,
            message: this.loading.feedback
        };
    }

    private async runWithLoading<T>(
        action: Promise<T>,
        loadingLabel?: string,
        successMessage?: string,
        failureMessage?: string
    ) {
        return await this.loading.runCallbackWithLoading(
            action,
            loadingLabel,
            successMessage,
            failureMessage
        );
    }
}
