import cloneDeep from "lodash/cloneDeep";
import { makeAutoObservable, runInAction } from "mobx";

import { Loading } from "../domain";
import { IconPackProviderInterface as IconPackProvider } from "~/components/IconPicker/config";
import { Icon } from "~/components/IconPicker/types";

export class IconRepository {
    private loading: Loading;
    private icons: Icon[] = [];
    public iconPackProviders: IconPackProvider[];
    public readonly namespace: string;

    constructor(iconPackProviders: IconPackProvider[], namespace: string) {
        this.loading = new Loading(true);
        this.iconPackProviders = iconPackProviders;
        this.namespace = namespace;
        makeAutoObservable(this);
    }

    async loadProviders() {
        const iconPacks = await this.runWithLoading<Icon[][]>(
            Promise.all(this.iconPackProviders.map(provider => provider.getIcons()))
        );

        runInAction(() => {
            this.icons = iconPacks?.flat() || [];
        });
    }

    setIconPackProviders(newProviders: IconPackProvider[]) {
        if (newProviders.length !== this.iconPackProviders.length) {
            this.iconPackProviders = newProviders;
            this.loadProviders();
        }
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
