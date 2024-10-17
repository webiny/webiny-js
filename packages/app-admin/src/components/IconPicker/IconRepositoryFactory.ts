import { IconRepository } from "./IconRepository";
import { IconPackProviderInterface as IconPackProvider, IconType } from "./config";

class IconRepositoryFactory {
    private cache: Map<string, IconRepository> = new Map();

    getRepository(iconTypes: IconType[], iconPackProviders: IconPackProvider[]) {
        const cacheKey = this.getCacheKey(iconTypes, iconPackProviders);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new IconRepository(iconTypes, iconPackProviders));
        }

        return this.cache.get(cacheKey) as IconRepository;
    }

    private getCacheKey(iconTypes: IconType[], iconPackProviders: IconPackProvider[]) {
        return [
            ...iconTypes.map(iconType => iconType.name).sort(),
            ...iconPackProviders.map(provider => provider.name).sort()
        ].join("#");
    }
}

export const iconRepositoryFactory = new IconRepositoryFactory();
