import security from "@webiny/app-security";
import adminUsersCognito from "@webiny/app-admin-users-cognito";
import accountDetails from "@webiny/app-admin-users-cognito/userMenu/accountDetails";
import signOut from "@webiny/app-admin-users-cognito/userMenu/signOut";
import userImage from "@webiny/app-admin-users-cognito/userMenu/userImage";
import userInfo from "@webiny/app-admin-users-cognito/userMenu/userInfo";

export default [
    security(),
    
    /**
     * Add user management module to admin app.
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
