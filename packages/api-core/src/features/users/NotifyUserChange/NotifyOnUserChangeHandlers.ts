import { UserAfterCreateEventHandler } from "~/features/users/CreateUser/index.js";
import { UserAfterUpdateEventHandler } from "~/features/users/UpdateUser/index.js";
import { UserAfterDeleteEventHandler } from "~/features/users/DeleteUser/index.js";
import { NotifyUserChangeUseCase } from "./abstractions.js";

class NotifyOnUserCreatedHandlerImpl implements UserAfterCreateEventHandler.Interface {
    constructor(private notifyUserChange: NotifyUserChangeUseCase.Interface) {}

    async handle(event: UserAfterCreateEventHandler.Event): Promise<void> {
        await this.notifyUserChange.execute({ id: event.payload.user.id, change: "created" });
    }
}

export const NotifyOnUserCreatedHandler = UserAfterCreateEventHandler.createImplementation({
    implementation: NotifyOnUserCreatedHandlerImpl,
    dependencies: [NotifyUserChangeUseCase]
});

class NotifyOnUserUpdatedHandlerImpl implements UserAfterUpdateEventHandler.Interface {
    constructor(private notifyUserChange: NotifyUserChangeUseCase.Interface) {}

    async handle(event: UserAfterUpdateEventHandler.Event): Promise<void> {
        await this.notifyUserChange.execute({
            id: event.payload.updatedUser.id,
            change: "updated"
        });
    }
}

export const NotifyOnUserUpdatedHandler = UserAfterUpdateEventHandler.createImplementation({
    implementation: NotifyOnUserUpdatedHandlerImpl,
    dependencies: [NotifyUserChangeUseCase]
});

class NotifyOnUserDeletedHandlerImpl implements UserAfterDeleteEventHandler.Interface {
    constructor(private notifyUserChange: NotifyUserChangeUseCase.Interface) {}

    async handle(event: UserAfterDeleteEventHandler.Event): Promise<void> {
        await this.notifyUserChange.execute({ id: event.payload.user.id, change: "deleted" });
    }
}

export const NotifyOnUserDeletedHandler = UserAfterDeleteEventHandler.createImplementation({
    implementation: NotifyOnUserDeletedHandlerImpl,
    dependencies: [NotifyUserChangeUseCase]
});
