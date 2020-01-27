import { CircularProgress as Loading } from "@webiny/ui/Progress";
import SignIn from "./views/SignIn";
import ForgotPassword from "./views/ForgotPassword";
import RequireNewPassword from "./views/RequireNewPassword";
import SetNewPassword from "./views/SetNewPassword";
import InstallForm from "./views/InstallForm";
import UserForm from "./views/UserForm";
import UserAccountForm from "./views/UserAccountForm";
import {
    SecurityCognitoViewForgotPasswordPlugin,
    SecurityCognitoViewLoadingPlugin,
    SecurityCognitoViewRequireNewPasswordPlugin,
    SecurityCognitoViewSetNewPasswordPlugin,
    SecurityCognitoViewSignInPlugin
} from "@webiny/app-plugin-security-cognito/types";
import {
    SecurityViewInstallationFormPlugin,
    SecurityViewUserAccountFormPlugin,
    SecurityViewUserFormPlugin
} from "@webiny/app-security/types";

export default () => [
    // The following `cognito-view` plugins are used by `app-plugin-security-cognito`.
    {
        name: "cognito-view-sign-in",
        type: "cognito-view",
        view: SignIn
    } as SecurityCognitoViewSignInPlugin,
    {
        name: "cognito-view-forgot-password",
        type: "cognito-view",
        view: ForgotPassword
    } as SecurityCognitoViewForgotPasswordPlugin,
    {
        name: "cognito-view-require-new-password",
        type: "cognito-view",
        view: RequireNewPassword
    } as SecurityCognitoViewRequireNewPasswordPlugin,
    {
        name: "cognito-view-set-new-password",
        type: "cognito-view",
        view: SetNewPassword
    } as SecurityCognitoViewSetNewPasswordPlugin,
    {
        name: "cognito-view-loading",
        type: "cognito-view",
        view: Loading
    } as SecurityCognitoViewLoadingPlugin,
    // The following plugins are required by `app-security` to render user/account/install forms.
    {
        name: "security-view-install-form",
        type: "security-view",
        view: InstallForm
    } as SecurityViewInstallationFormPlugin,
    {
        name: "security-view-user-form",
        type: "security-view",
        view: UserForm
    } as SecurityViewUserFormPlugin,
    {
        name: "security-view-user-account-form",
        type: "security-view",
        view: UserAccountForm
    } as SecurityViewUserAccountFormPlugin
];
