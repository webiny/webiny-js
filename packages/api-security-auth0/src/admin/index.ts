export { Auth0 } from "./Auth0.js";
export type { Auth0Props } from "./Auth0.js";
import { UserInfo } from "./modules/userMenu/UserInfo.js";
import { UserImage } from "./modules/userMenu/UserImage.js";
import { ExitTenant } from "./modules/userMenu/ExitTenant.js";
import { SignOut } from "./modules/userMenu/SignOut.js";
import { NotAuthorizedError, LoginContent, LoginLayout } from "./components/index.js";

export const Components = {
    UserInfo,
    UserImage,
    ExitTenant,
    SignOut,
    NotAuthorizedError,
    LoginContent,
    LoginLayout
};
