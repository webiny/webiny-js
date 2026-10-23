import { makeAutoObservable, runInAction } from "mobx";
import { CreateUserUseCase } from "~/admin/features/users/createUser/index.js";
import { LinkUserUseCase } from "~/admin/features/users/linkUser/index.js";
import { CheckEmailUseCase } from "~/admin/features/users/checkEmail/index.js";
import { AdminUsersError } from "~/admin/features/users/shared/AdminUsersError.js";
import {
    UserFormPresenter as PresenterAbstraction,
    type NewUserFormData,
    type UserFormMode,
    type UserFormSubmitResult
} from "./abstractions.js";

export const EMAIL_EXISTS_HERE = "A user with this email already exists in this tenant.";

const EXISTS_IN_OTHER_TENANT = "Cognito/Account/ExistsInOtherTenant";

const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

class UserFormPresenterImpl implements PresenterAbstraction.Interface {
    private mode: UserFormMode = "create";
    private emailError: string | null = null;
    private saving = false;
    /** The email `mode` and `emailError` belong to. */
    private checkedEmail: string | null = null;
    private checkCount = 0;

    constructor(
        private createUser: CreateUserUseCase.Interface,
        private linkUser: LinkUserUseCase.Interface,
        private checkEmailUseCase: CheckEmailUseCase.Interface
    ) {
        makeAutoObservable(this);
    }

    get vm() {
        return {
            mode: this.mode,
            emailError: this.emailError,
            saving: this.saving
        };
    }

    reset() {
        this.mode = "create";
        this.emailError = null;
        this.saving = false;
        this.checkedEmail = null;
    }

    async checkEmail(value: string) {
        // The API finds this tenant's user by the email as stored, so send it as typed.
        const email = (value ?? "").trim();
        const key = email.toLowerCase();
        if (key === this.checkedEmail) {
            return;
        }

        const check = ++this.checkCount;
        this.checkedEmail = key;

        if (!looksLikeEmail(email)) {
            this.setStatus("create", null);
            return;
        }

        let status: CheckEmailUseCase.Status;
        try {
            status = await this.checkEmailUseCase.execute(email);
        } catch {
            // Creating the user reports any problem with the email. Check it again next time.
            status = "AVAILABLE";
            runInAction(() => {
                if (check === this.checkCount) {
                    this.checkedEmail = null;
                }
            });
        }

        // A newer email was entered while this one was being checked.
        if (check !== this.checkCount) {
            return;
        }

        if (status === "EXISTS_ELSEWHERE") {
            this.setStatus("link", null);
        } else if (status === "EXISTS_HERE") {
            this.setStatus("create", EMAIL_EXISTS_HERE);
        } else {
            this.setStatus("create", null);
        }
    }

    async submit(data: NewUserFormData): Promise<UserFormSubmitResult> {
        this.saving = true;

        try {
            if (this.mode === "link") {
                const user = await this.linkUser.execute({
                    data: { email: data.email, roles: data.roles, teams: data.teams }
                });
                return { type: "linked", user };
            }

            try {
                const user = await this.createUser.execute({ data });
                return { type: "created", user };
            } catch (error) {
                if (error instanceof AdminUsersError && error.code === EXISTS_IN_OTHER_TENANT) {
                    runInAction(() => {
                        this.checkedEmail = (data.email ?? "").trim().toLowerCase();
                        this.setStatus("link", null);
                    });
                    return { type: "linkRequired" };
                }
                throw error;
            }
        } catch (error) {
            return {
                type: "failed",
                message: error instanceof Error ? error.message : "Unknown error"
            };
        } finally {
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    private setStatus(mode: UserFormMode, emailError: string | null) {
        this.mode = mode;
        this.emailError = emailError;
    }
}

export const UserFormPresenter = PresenterAbstraction.createImplementation({
    implementation: UserFormPresenterImpl,
    dependencies: [CreateUserUseCase, LinkUserUseCase, CheckEmailUseCase]
});
