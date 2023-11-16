import { IconRepository } from "../domain";
import { IconPackProviderInterface as IconPackProvider } from "~/components/IconPicker/config";

class IconRepositoryFactory {
    private cache: Map<string, IconRepository> = new Map();

    getRepository(iconPackProviders: IconPackProvider[], namespace: string) {
        let repository;

        if (!this.cache.has(namespace)) {
            repository = new IconRepository(iconPackProviders, namespace);
            this.cache.set(namespace, repository);
        } else {
            repository = this.cache.get(namespace) as IconRepository;
            repository.setIconPackProviders(iconPackProviders);
        }

        return repository;
    }
}

export const iconRepositoryFactory = new IconRepositoryFactory();
