import { RoleAfterCreateEventHandler } from "~/features/security/roles/CreateRole/index.js";
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
