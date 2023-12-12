import cloneDeep from "lodash/cloneDeep";
import { makeAutoObservable, runInAction } from "mobx";

import { Loading } from "./Loading";
import { IconPackProviderInterface as IconPackProvider, IconType } from "./config";
import { Icon } from "./types";

export class IconRepository {
    private readonly iconPackProviders: IconPackProvider[];
    private readonly iconTypes: IconType[];
    private loading: Loading;
    private icons: Icon[] = [];

    constructor(iconTypes: IconType[], iconPackProviders: IconPackProvider[]) {
        this.iconTypes = iconTypes;
        this.loading = new Loading(true);
        this.iconPackProviders = iconPackProviders;
        makeAutoObservable(this);
    }

    async loadIcons() {
        if (this.icons.length > 0) {
            return;
        }

        const icons = await this.runWithLoading(async () => {
            const icons = await Promise.all(
                this.iconPackProviders.map(provider => provider.getIcons())
            );
            return icons.flat();
        });

        const iconTypes = this.iconTypes.map(iconType => iconType.name);

        runInAction(() => {
            // Make sure we only work with known icon types.
            this.icons = icons.filter(icon => iconTypes.includes(icon.type));
        });
    }

    getIcons() {
        return cloneDeep(this.icons);
    }

    addIcon(icon: Icon) {
        this.icons = [...this.icons, icon];
    }

    getIconTypes() {
        return this.iconTypes;
    }

    getLoading() {
        return {
            isLoading: this.loading.isLoading,
            loadingLabel: this.loading.loadingLabel,
            message: this.loading.feedback
        };
    }

    private async runWithLoading<T>(
        action: () => Promise<T>,
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
