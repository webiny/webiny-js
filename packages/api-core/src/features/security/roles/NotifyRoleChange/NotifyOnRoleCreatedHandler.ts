import { RoleAfterCreateEventHandler } from "~/features/security/roles/CreateRole/index.js";
import { NotifyRecordChangeUseCase } from "~/features/websockets/index.js";
import { ROLE_RECORD_TYPE } from "./recordType.js";

class NotifyOnRoleCreatedHandlerImpl implements RoleAfterCreateEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: RoleAfterCreateEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: ROLE_RECORD_TYPE,
            id: event.payload.role.id,
            change: "created"
        });
    }
}

export const NotifyOnRoleCreatedHandler = RoleAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnRoleCreatedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
