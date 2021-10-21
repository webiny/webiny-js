import accessManagement from "@webiny/app-security-access-management";
// import { plugins as adminUsersCognito } from "@webiny/app-admin-users-cognito";
// import accountDetails from "@webiny/app-admin-users-cognito/plugins/userMenu/accountDetails";
// import signOut from "@webiny/app-admin-users-cognito/plugins/userMenu/signOut";
// import userImage from "@webiny/app-admin-users-cognito/plugins/userMenu/userImage";
// import userInfo from "@webiny/app-admin-users-cognito/plugins/userMenu/userInfo";

import accountDetails from "@webiny/app-admin-okta/plugins/userMenu/accountDetails";
import signOut from "@webiny/app-admin-okta/plugins/userMenu/signOut";
import userImage from "@webiny/app-admin-okta/plugins/userMenu/userImage";
import userInfo from "@webiny/app-admin-okta/plugins/userMenu/userInfo";

export default [
    /**
     * Access Management (Groups, API keys)
     */
    accessManagement(),
    /**
     * Admin Users management.
     */
    // adminUsersCognito(),
    /**
     * User menu plugins
     */
    accountDetails(),
    signOut(),
    userImage(),
    userInfo()
];
