import { CircularProgress as Loading } from "@webiny/ui/Progress";
import SignIn from "./SignIn";
import ForgotPassword from "./ForgotPassword";
import RequireNewPassword from "./RequireNewPassword";
import SetNewPassword from "./SetNewPassword";

export default () => [
    {
        name: "cognito-view-sign-in",
        type: "cognito-view",
        viewType: "signIn",
        view: SignIn
    },
    {
        name: "cognito-view-forgot-password",
        type: "cognito-view",
        viewType: "forgotPassword",
        view: ForgotPassword
    },
    {
        name: "cognito-view-require-new-password",
        type: "cognito-view",
        viewType: "requireNewPassword",
        view: RequireNewPassword
    },
    {
        name: "cognito-view-set-new-password",
        type: "cognito-view",
        viewType: "setNewPassword",
        view: SetNewPassword
    },
    {
        name: "cognito-view-loading",
        type: "cognito-view",
        viewType: "loading",
        view: Loading
    }
];
