import { UserAfterCreateEventHandler } from "~/features/users/CreateUser/index.js";
import { UserAfterUpdateEventHandler } from "~/features/users/UpdateUser/index.js";
import { UserAfterDeleteEventHandler } from "~/features/users/DeleteUser/index.js";
import { NotifyRecordChangeUseCase } from "~/features/websockets/index.js";
import { USER_RECORD_TYPE } from "./recordType.js";

class NotifyOnUserCreatedHandlerImpl implements UserAfterCreateEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: UserAfterCreateEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: USER_RECORD_TYPE,
            id: event.payload.user.id,
            change: "created"
        });
    }
}

export const NotifyOnUserCreatedHandler = UserAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnUserCreatedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});

class NotifyOnUserUpdatedHandlerImpl implements UserAfterUpdateEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: UserAfterUpdateEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: USER_RECORD_TYPE,
            id: event.payload.updatedUser.id,
            change: "updated"
        });
    }
}

export const NotifyOnUserUpdatedHandler = UserAfterUpdateEventHandler.createImplementation({
    implementation: NotifyOnUserUpdatedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});

class NotifyOnUserDeletedHandlerImpl implements UserAfterDeleteEventHandler.Interface {
    constructor(private notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    async handle(event: UserAfterDeleteEventHandler.Event): Promise<void> {
        await this.notifyRecordChange.execute({
            type: USER_RECORD_TYPE,
            id: event.payload.user.id,
            change: "deleted"
        });
    }
}

export const NotifyOnUserDeletedHandler = UserAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnUserDeletedHandlerImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
