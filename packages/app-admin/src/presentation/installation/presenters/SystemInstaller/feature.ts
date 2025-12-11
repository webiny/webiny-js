import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { SystemInstallerPresenter as SystemInstallerPresenterAbstraction } from "./abstractions.js";
import { SystemInstallerGateway } from "./SystemInstallerGateway.js";
import { SystemInstallerRepository } from "./SystemInstallerRepository.js";
import { SystemInstallerPresenter } from "./SystemInstallerPresenter.js";

export const SystemInstallerFeature = createFeature({
    name: "SystemInstaller",
    register(container: Container) {
        container.register(SystemInstallerGateway).inSingletonScope();
        container.register(SystemInstallerRepository).inSingletonScope();
        container.register(SystemInstallerPresenter).inSingletonScope();
    },
    resolve(container: Container) {
        return {
            presenter: container.resolve(SystemInstallerPresenterAbstraction)
        };
    }
});
