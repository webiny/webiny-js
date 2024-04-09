export { Okta } from "./Okta";
export type { OktaProps, OktaFactory } from "./Okta";
import { UserInfo } from "./modules/userMenu/userInfo";
import { UserImage } from "./modules/userMenu/userImage";
import { ExitTenant } from "./modules/userMenu/exitTenant";
import { SignOut } from "./modules/userMenu/signOut";
import { NotAuthorizedError } from "./components";

export const Components = {
    UserInfo,
    UserImage,
    ExitTenant,
    SignOut,
    NotAuthorizedError
};
