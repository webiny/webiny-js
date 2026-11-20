import { RoleAfterUpdateEventHandler } from "~/features/security/roles/UpdateRole/index.js";
import { NotifyRecordChangeUseCase } from "~/features/websockets/index.js";
import { ROLE_RECORD_TYPE } from "./recordType.js";

class NotifyOnRoleUpdatedHandlerImpl implements RoleAfterUpdateEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: RoleAfterUpdateEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: ROLE_RECORD_TYPE,
            id: event.payload.updated.id,
            change: "updated"
        });
    }
}

export const NotifyOnRoleUpdatedHandler = RoleAfterUpdateEventHandler.createImplementation({
    implementation: NotifyOnRoleUpdatedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
