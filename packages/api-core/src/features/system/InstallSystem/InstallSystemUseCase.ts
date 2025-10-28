import { Result, createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core";
import { InstallSystemUseCase as UseCaseAbstraction } from "./abstractions.js";
import { InstallTenantUseCase } from "~/features/tenancy/InstallTenant/index.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { CreateTenantUseCase } from "~/features/tenancy/CreateTenant/index.js";
import { DeleteTenantUseCase } from "~/features/tenancy/DeleteTenant/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { InstallSystemInput } from "./abstractions.js";
import { SystemAlreadyInstalledError } from "./errors.js";
import { SystemInstalledEvent } from "./events.js";

class InstallSystemUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private installTenantUseCase: InstallTenantUseCase.Interface,
        private getRootTenantUseCase: GetRootTenantUseCase.Interface,
        private createTenantUseCase: CreateTenantUseCase.Interface,
        private deleteTenantUseCase: DeleteTenantUseCase.Interface
    ) {}

    async execute(installationInput: InstallSystemInput) {
        const rootTenantResult = await this.getRootTenantUseCase.execute();

        if (rootTenantResult.isOk()) {
            return Result.fail(new SystemAlreadyInstalledError());
        }

        const createTenantResult = await this.createTenantUseCase.execute({
            id: "root",
            name: "Root",
            tags: [],
            description: "The top-level Webiny tenant.",
            parent: ""
        });

        if (createTenantResult.isFail()) {
            return Result.fail(createTenantResult.error);
        }

        const rootTenant = createTenantResult.value;

        this.tenantContext.setTenant(rootTenant);

        const installResult = await this.identityContext.withoutAuthorization(() => {
            return this.installTenantUseCase.execute({
                tenant: rootTenant,
                installationInput
            });
        });

        if (installResult.isOk()) {
            await this.eventPublisher.publish(new SystemInstalledEvent());
            return Result.ok();
        }

        // If tenant installation failed, delete the root tenant
        await this.deleteTenantUseCase.execute("root");

        return Result.fail(installResult.error);
    }
}

export const InstallSystemUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: InstallSystemUseCaseImpl,
    dependencies: [
        IdentityContext,
        TenantContext,
        EventPublisher,
        InstallTenantUseCase,
        GetRootTenantUseCase,
        CreateTenantUseCase,
        DeleteTenantUseCase
    ]
});
