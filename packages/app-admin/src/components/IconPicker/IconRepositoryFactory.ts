import { ApolloClient } from "apollo-client";

import { IconRepository } from "./IconRepository";
import { CustomIconsGateway, CustomIconsGatewayInterface } from "./gateways";
import { IconPackProviderInterface as IconPackProvider, IconType } from "./config";

class IconRepositoryFactory {
    private gateway: CustomIconsGatewayInterface | undefined;
    private cache: Map<string, IconRepository> = new Map();

    getRepository(
        client: ApolloClient<any>,
        iconTypes: IconType[],
        iconPackProviders: IconPackProvider[]
    ) {
        if (!this.gateway) {
            this.gateway = new CustomIconsGateway(client);
        }

        const cacheKey = this.getCacheKey(iconTypes, iconPackProviders);

        if (!this.cache.has(cacheKey)) {
            this.cache.set(
                cacheKey,
                new IconRepository(this.gateway, iconTypes, iconPackProviders)
            );
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
