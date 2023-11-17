import { IconRepository } from "../domain";
import { IconPackProviderInterface as IconPackProvider } from "~/components/IconPicker/config";

class IconRepositoryFactory {
    private cache: Map<string, IconRepository> = new Map();

    getRepository(iconPackProviders: IconPackProvider[]) {
        const cacheKey = iconPackProviders
            .map(provider => provider.name)
            .sort()
            .join("#");

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, new IconRepository(iconPackProviders));
        }

        return this.cache.get(cacheKey) as IconRepository;
    }
}

export const iconRepositoryFactory = new IconRepositoryFactory();
