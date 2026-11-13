import { createFeature } from "@webiny/feature/admin";
import { ResetMfaPresenter as PresenterAbstraction } from "./abstractions.js";
import { ResetMfaPresenter } from "./ResetMfaPresenter.js";

/**
 * The Reset MFA action on an existing user. Needs the ResetUserMfa feature.
 */
export const ResetMfaFeature = createFeature({
    name: "Cognito/Users/ResetMfa",
    register(container) {
        container.register(ResetMfaPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(PresenterAbstraction)
        };
    }
});
