import { RoleAfterUpdateEventHandler } from "@webiny/api-core/features/security/roles/UpdateRole/index.js";
import { NotifyRoleChangeUseCase } from "./abstractions.js";

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
