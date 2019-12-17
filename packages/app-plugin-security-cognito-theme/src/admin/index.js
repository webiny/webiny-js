import { CircularProgress as Loading } from "@webiny/ui/Progress";
import SignIn from "./views/SignIn";
import ForgotPassword from "./views/ForgotPassword";
import RequireNewPassword from "./views/RequireNewPassword";
import SetNewPassword from "./views/SetNewPassword";
import InstallForm from "./views/InstallForm";
import UserForm from "./views/UserForm";
import UserAccountForm from "./views/UserAccountForm";

export default () => [
    // The following `cognito-view` plugins are used by `app-plugin-security-cognito`.
    {
        name: "cognito-view-sign-in",
        type: "cognito-view",
        view: SignIn
    },
    {
        name: "cognito-view-forgot-password",
        type: "cognito-view",
        view: ForgotPassword
    },
    {
        name: "cognito-view-require-new-password",
        type: "cognito-view",
        view: RequireNewPassword
    },
    {
        name: "cognito-view-set-new-password",
        type: "cognito-view",
        view: SetNewPassword
    },
    {
        name: "cognito-view-loading",
        type: "cognito-view",
        view: Loading
    },
    // The following plugins are required by `app-security` to render user/account/install forms.
    {
        name: "security-view-install-form",
        type: "security-view",
        view: InstallForm
    },
    {
        name: "security-view-user-form",
        type: "security-view",
        view: UserForm
    },
    {
        name: "security-view-user-account-form",
        type: "security-view",
        view: UserAccountForm
    }
];
