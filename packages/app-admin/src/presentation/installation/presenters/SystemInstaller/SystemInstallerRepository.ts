import { createImplementation } from "@webiny/di";
import { LocalStorage } from "@webiny/app/features/localStorage";
import {
    SystemInstallerRepository as Abstraction,
    SystemInstallerGateway,
    type InstallationInput
} from "./abstractions.js";

const LOCAL_STORAGE_KEY = "system/installed";

class SystemInstallerRepositoryImpl implements Abstraction.Interface {
    constructor(
        private localStorage: LocalStorage.Interface,
        private gateway: SystemInstallerGateway.Interface
    ) {}

    async isSystemInstalled(): Promise<boolean> {
        const cachedValue = this.localStorage.get<boolean>(LOCAL_STORAGE_KEY);
        if (cachedValue === true) {
            return true;
        }

        const isInstalled = await this.gateway.isSystemInstalled();
        this.localStorage.set(LOCAL_STORAGE_KEY, isInstalled);
        return isInstalled;
    }

    async installSystem(data: InstallationInput): Promise<void> {
        await this.gateway.installSystem(data);
        this.localStorage.set(LOCAL_STORAGE_KEY, true);
    }
}

export const SystemInstallerRepository = createImplementation({
    abstraction: Abstraction,
    implementation: SystemInstallerRepositoryImpl,
    dependencies: [LocalStorage, SystemInstallerGateway]
});
