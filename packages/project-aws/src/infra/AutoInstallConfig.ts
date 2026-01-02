import { AutoInstallConfig as AutoInstallConfigAbstraction } from "~/abstractions/AutoInstallConfig.js";

class AutoInstallConfigImpl implements AutoInstallConfigAbstraction.Interface {
    private config: AutoInstallConfigAbstraction.Config = {
        enabled: false
    };

    setConfig(config: AutoInstallConfigAbstraction.Config) {
        this.config = config;
    }

    getConfig(): AutoInstallConfigAbstraction.Config {
        return this.config;
    }
}

export const AutoInstallConfig = AutoInstallConfigAbstraction.createImplementation({
    implementation: AutoInstallConfigImpl,
    dependencies: []
});
