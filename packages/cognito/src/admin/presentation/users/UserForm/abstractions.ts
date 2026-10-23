import { createAbstraction } from "@webiny/feature/admin";
import type { ICreateUserGatewayResult } from "~/admin/features/users/createUser/abstractions/index.js";

/**
 * - `create`: a new person; the form asks for their name and password.
 * - `link`: the email has an account in another tenant; the form only asks for roles and teams.
 */
export type UserFormMode = "create" | "link";

export interface UserFormVM {
    mode: UserFormMode;
    /** Set when the email can't be used in this tenant. */
    emailError: string | null;
    saving: boolean;
}

export interface NewUserFormData {
    email: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    avatar?: any;
    roles?: unknown[];
    teams?: unknown[];
}

export type UserFormUser = ICreateUserGatewayResult;

export type UserFormSubmitResult =
    | { type: "created"; user: UserFormUser }
    | { type: "linked"; user: UserFormUser }
    /** The email turned out to have an account in another tenant: the form is now in `link` mode. */
    | { type: "linkRequired" }
    | { type: "failed"; message: string };

export interface IUserFormPresenter {
    vm: UserFormVM;

    /** Back to an empty New User form. */
    reset(): void;

    /** Looks up the email and sets `mode` and `emailError` from it. */
    checkEmail(email: string): Promise<void>;

    submit(data: NewUserFormData): Promise<UserFormSubmitResult>;
}

export const UserFormPresenter = createAbstraction<IUserFormPresenter>("Cognito/UserFormPresenter");

export namespace UserFormPresenter {
    export type Interface = IUserFormPresenter;
    export type VM = UserFormVM;
    export type Mode = UserFormMode;
    export type Data = NewUserFormData;
    export type SubmitResult = UserFormSubmitResult;
}
