import { UserBeforeUpdateHandler } from "@webiny/api-admin-users/features/UpdateUser";
import { createImplementation } from "@webiny/feature/api";

class UserBeforeUpdateHandlerImpl implements UserBeforeUpdateHandler.Interface {
    async handle(event: UserBeforeUpdateHandler.Event): Promise<void> {
        const { user, updateData } = event.payload;

        if (user.external) {
            return;
        }

        // Immediately delete password from `updateData`, as that object will be merged with the `user` data.
        // @ts-expect-error
        delete updateData["password"];
    }
}

export const CognitoUserBeforeUpdateHandler = createImplementation({
    abstraction: UserBeforeUpdateHandler,
    implementation: UserBeforeUpdateHandlerImpl,
    dependencies: []
});
