import { RoleAfterCreateEventHandler } from "@webiny/api-core/features/security/roles/CreateRole/index.js";
import { RoleAfterUpdateEventHandler } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";
import { RoleAfterDeleteEventHandler } from "@webiny/api-core/features/security/roles/DeleteRole/index.js";
import { NotifyRoleChangeUseCase } from "./abstractions.js";

class NotifyOnRoleCreatedHandlerImpl implements RoleAfterCreateEventHandler.Interface {
    constructor(private notifyRoleChange: NotifyRoleChangeUseCase.Interface) {}

    async handle(event: RoleAfterCreateEventHandler.Event): Promise<void> {
        await this.notifyRoleChange.execute({ id: event.payload.role.id, change: "created" });
    }
}

export const NotifyOnRoleCreatedHandler = RoleAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnRoleCreatedHandlerImpl,
    dependencies: [NotifyRoleChangeUseCase]
});

class NotifyOnRoleUpdatedHandlerImpl implements RoleAfterUpdateEventHandler.Interface {
    constructor(private notifyRoleChange: NotifyRoleChangeUseCase.Interface) {}

    async handle(event: RoleAfterUpdateEventHandler.Event): Promise<void> {
        await this.notifyRoleChange.execute({ id: event.payload.updated.id, change: "updated" });
    }
}

export const NotifyOnRoleUpdatedHandler = RoleAfterUpdateEventHandler.createImplementation({
    implementation: NotifyOnRoleUpdatedHandlerImpl,
    dependencies: [NotifyRoleChangeUseCase]
});

class NotifyOnRoleDeletedHandlerImpl implements RoleAfterDeleteEventHandler.Interface {
    constructor(private notifyRoleChange: NotifyRoleChangeUseCase.Interface) {}

    async handle(event: RoleAfterDeleteEventHandler.Event): Promise<void> {
        await this.notifyRoleChange.execute({ id: event.payload.role.id, change: "deleted" });
    }
}

export const NotifyOnRoleDeletedHandler = RoleAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnRoleDeletedHandlerImpl,
    dependencies: [NotifyRoleChangeUseCase]
});
