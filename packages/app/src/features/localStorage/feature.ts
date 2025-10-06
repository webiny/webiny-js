import {
    LocalStorageConfig,
    LocalStorageGateway,
    LocalStorageService as Abstraction
} from "./abstractions.js";
import { BrowserLocalStorageGateway } from "./BrowserLocalStorageGateway.js";
import { LocalStorageRepository } from "./LocalStorageRepository.js";
import { LocalStorageService } from "./LocalStorageService.js";
import { createFeature } from "~/shared/di/createFeature.js";

/**
 * LocalStorageFeature wires together:
 *  - BrowserLocalStorageGateway (default gateway)
 *  - LocalStorageRepository (reactive MobX mirror)
 *  - LocalStorageService (thin consumer-facing facade)
 */
export const LocalStorageFeature = createFeature({
    name: "LocalStorage",
    register(container, config: { prefix?: string } = {}) {
        // Register config (tenant prefix, etc.)
        container.registerInstance(LocalStorageConfig, config);

        // Gateway: browser localStorage
        container.registerInstance(LocalStorageGateway, new BrowserLocalStorageGateway());

        // Repository & Service
        container.register(LocalStorageRepository).inSingletonScope();
        container.register(LocalStorageService).inSingletonScope();
    },
    resolve(container) {
        return {
            localStorageService: container.resolve(Abstraction),
            localStorageConfig: container.resolve(LocalStorageConfig)
        };
    }
});
