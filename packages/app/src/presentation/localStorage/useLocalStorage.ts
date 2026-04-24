import { LocalStorageFeature } from "~/features/localStorage/feature.js";
import { LocalStorage } from "~/features/localStorage/index.js";
import { useFeature } from "~/shared/di/useFeature.js";

/**
 * Returns the LocalStorage instance from DI.
 * Useful when you want to call service methods imperatively inside components.
 */
export function useLocalStorage(): LocalStorage.Interface {
    const { localStorageService } = useFeature(LocalStorageFeature);

    return {
        get: localStorageService.get.bind(localStorageService),
        set: localStorageService.set.bind(localStorageService),
        remove: localStorageService.remove.bind(localStorageService),
        clear: localStorageService.clear.bind(localStorageService),
        keys: localStorageService.keys.bind(localStorageService)
    };
}
