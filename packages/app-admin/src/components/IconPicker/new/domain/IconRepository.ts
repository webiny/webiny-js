import cloneDeep from "lodash/cloneDeep";
import { makeAutoObservable } from "mobx";

import { Loading, IconPickerConfig } from "../domain";

export class IconRepository {
    private loading: Loading;
    public config: IconPickerConfig;
    public readonly namespace: string;

    constructor(config: IconPickerConfig, namespace: string) {
        this.loading = new Loading();
        this.config = config;
        this.namespace = namespace;
        makeAutoObservable(this);
    }

    async initialize() {
        await this.runWithLoading<void>(this.config.initialize());
    }

    getIcons() {
        return cloneDeep(this.config.icons);
    }

    updateConfig(config: IconPickerConfig) {
        this.config = config;
        this.initialize();
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
