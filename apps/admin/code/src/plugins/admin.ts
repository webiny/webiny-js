import adminApp from "@webiny/app-admin/plugins";
import logo from "@webiny/app-admin/plugins/logo";
import darkMode from "@webiny/app-admin/plugins/userMenu/darkMode";
import help from "@webiny/app-admin/plugins/userMenu/help";
import sendFeedback from "@webiny/app-admin/plugins/userMenu/feedback";
import slack from "@webiny/app-admin/plugins/menu/slack";
import source from "@webiny/app-admin/plugins/menu/source";
import documentation from "@webiny/app-admin/plugins/menu/documentation";
import apiInformation from "@webiny/app-admin/plugins/menu/apiInformation";

export default [
    adminApp,
    logo,
    // User meny
    darkMode,
    help,
    sendFeedback,
    // Navigation menu footer
    apiInformation,
    documentation,
    slack,
    source
];
