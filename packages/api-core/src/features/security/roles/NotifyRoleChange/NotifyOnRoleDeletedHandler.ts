import { RoleAfterDeleteEventHandler } from "~/features/security/roles/DeleteRole/index.js";
import { NotifyRecordChangeUseCase } from "~/features/websockets/index.js";
import { ROLE_RECORD_TYPE } from "./recordType.js";

class NotifyOnRoleDeletedHandlerImpl implements RoleAfterDeleteEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: RoleAfterDeleteEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: ROLE_RECORD_TYPE,
            id: event.payload.role.id,
            change: "deleted"
        });
    }
}

export const NotifyOnRoleDeletedHandler = RoleAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnRoleDeletedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
