export { Auth0 } from "./Auth0";
export type { Auth0Props } from "./Auth0";
import { UserInfo } from "./modules/userMenu/userInfo";
import { UserImage } from "./modules/userMenu/userImage";
import { ExitTenant } from "./modules/userMenu/exitTenant";
import { SignOut } from "./modules/userMenu/signOut";
import { NotAuthorizedError, LoginContent, LoginLayout } from "./components";

export const Components = {
    UserInfo,
    UserImage,
    ExitTenant,
    SignOut,
    NotAuthorizedError,
    LoginContent,
    LoginLayout
};
