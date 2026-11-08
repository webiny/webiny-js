import { makeAutoObservable, runInAction } from "mobx";
import { ResetUserMfaUseCase } from "~/admin/features/users/resetUserMfa/index.js";
import {
    ResetMfaPresenter as PresenterAbstraction,
    type ResetMfaInitParams,
    type ResetMfaResult,
    type ResetMfaUser
} from "./abstractions.js";

export const RESET_MFA_TITLE = "Reset MFA";

/**
 * The account is shared by all of the person's tenants, so the confirmation says the reset
 * applies to all of them.
 */
export const RESET_MFA_WARNING =
    "The user's authenticator app will be removed from their account, and they'll set up MFA again the next time they sign in. This applies to their sign-in in all of their tenants.";

class ResetMfaPresenterImpl implements PresenterAbstraction.Interface {
    private user: ResetMfaUser | undefined = undefined;
    private currentIdentityId: string | undefined = undefined;
    private resetting = false;

    constructor(private resetUserMfa: ResetUserMfaUseCase.Interface) {
        makeAutoObservable(this);
    }

    get vm() {
        const user = this.user;
        const available = !!user && user.external !== true && user.id !== this.currentIdentityId;

        return {
            available,
            resetting: this.resetting
        };
    }

    init({ user, currentIdentityId }: ResetMfaInitParams) {
        this.user = user;
        this.currentIdentityId = currentIdentityId;
    }

    async reset(): Promise<ResetMfaResult> {
        const user = this.user;
        if (!user || !this.vm.available) {
            return { type: "failed", message: "MFA can't be reset for this user." };
        }

        this.resetting = true;
        try {
            await this.resetUserMfa.execute({ id: user.id });
            return {
                type: "reset",
                message: `MFA reset for ${user.email}. They'll set it up again on their next sign-in.`
            };
        } catch (error) {
            return {
                type: "failed",
                message: error instanceof Error ? error.message : "Unknown error"
            };
        } finally {
            runInAction(() => {
                this.resetting = false;
            });
        }
    }
}

export const ResetMfaPresenter = PresenterAbstraction.createImplementation({
    implementation: ResetMfaPresenterImpl,
    dependencies: [ResetUserMfaUseCase]
});
