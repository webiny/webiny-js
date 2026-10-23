import { createFeature } from "@webiny/feature/admin";
import { UserFormPresenter as PresenterAbstraction } from "./abstractions.js";
import { UserFormPresenter } from "./UserFormPresenter.js";

/**
 * The New User form: creates a user, or links an account from another tenant.
 * Needs the CreateUser, LinkUser and CheckEmail features.
 */
export const UserFormFeature = createFeature({
    name: "Cognito/Users/UserForm",
    register(container) {
        container.register(UserFormPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
