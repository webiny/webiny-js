import { RoleAfterDeleteEventHandler } from "@webiny/api-core/features/security/roles/DeleteRole/index.js";
import { NotifyRoleChangeUseCase } from "./abstractions.js";

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
