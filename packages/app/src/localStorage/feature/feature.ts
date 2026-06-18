import { BrowserLocalStorageGateway } from "./BrowserLocalStorageGateway.js";
import { LocalStorageRepository } from "./LocalStorageRepository.js";
import { LocalStorage } from "./LocalStorage.js";
import type { ILocalStorageConfig } from "./abstractions.js";

export const createLocalStorage = (config: ILocalStorageConfig) => {
    const gateway = new BrowserLocalStorageGateway();
    const repository = new LocalStorageRepository(gateway, config);

    return new LocalStorage(repository);
};
