import type { IEcommerceApi, IEcommerceApiFactory } from "~/ecommerce";
import { IEcommerceSettings } from "~/ecommerce/features/settings/IEcommerceSettings";

interface IEcommerceApiProvider {
    setApiFactory(name: string, apiFactory: IEcommerceApiFactory): void;
    getApi(name: string): Promise<IEcommerceApi | undefined>;
}

export interface IEcommerceSettingsLoader {
    (name: string): Promise<IEcommerceSettings | undefined>;
}

export class EcommerceApiProvider implements IEcommerceApiProvider {
    private apiFactories: Map<string, IEcommerceApiFactory>;
    private apiCache: Map<string, IEcommerceApi>;
    private readonly settingsLoader: IEcommerceSettingsLoader;

    constructor(settingsLoader: IEcommerceSettingsLoader) {
        this.settingsLoader = settingsLoader;
        this.apiFactories = new Map<string, IEcommerceApiFactory>();
        this.apiCache = new Map<string, IEcommerceApi>();
    }

    async getApi(name: string): Promise<IEcommerceApi | undefined> {
        if (this.apiCache.has(name)) {
            return this.apiCache.get(name) as IEcommerceApi;
        }

        const apiFactory = this.apiFactories.get(name);
        if (!apiFactory) {
            return undefined;
        }

        const settings = await this.settingsLoader(name);
        if (!settings) {
            throw new Error(`${name} is not configured!`);
        }

        const api = await apiFactory(settings);

        this.apiCache.set(name, api);

        return api;
    }

    public setApiFactory(name: string, api: IEcommerceApiFactory): void {
        this.apiFactories.set(name, api);
    }
}
