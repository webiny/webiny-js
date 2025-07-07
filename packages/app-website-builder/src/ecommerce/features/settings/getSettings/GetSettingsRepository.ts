import type { IEcommerceSettings, IGetEcommerceSettings } from "./IGetEcommerceSettings";
import type { IEcommerceSettingsCache } from "../IEcommerceSettingsCache";

export class GetSettingsRepository implements IGetEcommerceSettings {
    private gateway: IGetEcommerceSettings;
    private cache: IEcommerceSettingsCache;

    constructor(cache: IEcommerceSettingsCache, gateway: IGetEcommerceSettings) {
        this.cache = cache;
        this.gateway = gateway;
    }

    async execute(name: string): Promise<IEcommerceSettings | undefined> {
        if (this.cache.has(name)) {
            return this.cache.get(name) as IEcommerceSettings;
        }

        const settings = this.gateway.execute(name);
        if (!settings) {
            return;
        }

        this.cache.set(name, settings);

        return settings;
    }
}
