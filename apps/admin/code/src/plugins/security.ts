import accessManagement from "@webiny/app-security-access-management";
import adminUsersCognito from "@webiny/app-admin-users-cognito";
import accountDetails from "@webiny/app-admin-users-cognito/userMenu/accountDetails";
import signOut from "@webiny/app-admin-users-cognito/userMenu/signOut";
import userImage from "@webiny/app-admin-users-cognito/userMenu/userImage";
import userInfo from "@webiny/app-admin-users-cognito/userMenu/userInfo";

export default [
    /**
     * Access Management (Groups, API keys)
     */
    accessManagement(),
    /**
     * Admin Users management.
     */
    adminUsersCognito(),
    /**
     * User menu plugins
     */
    accountDetails(),
    signOut(),
    userImage(),
    userInfo()
];
