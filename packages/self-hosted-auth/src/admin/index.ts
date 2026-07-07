// The admin login extension, loaded by the `SelfHostedAuth` config extension via its `src` path.
export { Extension } from "./Extension.js";
export { SelfHostedLogin, type SelfHostedLoginProps } from "./SelfHostedLogin.js";
export {
    SelfHostedLoginScreen,
    type SelfHostedLoginScreenProps,
    SELF_HOSTED_AUTH_TOKEN_KEY
} from "./presentation/SelfHostedLoginScreen.js";
