import { plugins } from "@webiny/plugins";
import imageComponent from "@webiny/app/plugins/image";
import cookiePolicyPlugins from "@webiny/app-cookie-policy/render";
import typeformPlugins from "@webiny/app-typeform/render";
import mailchimpPlugins from "@webiny/app-mailchimp/render";
import gtmPlugins from "@webiny/app-google-tag-manager/render";
import i18n from "./i18n";
import pageBuilder from "./pageBuilder";
import formBuilder from "./formBuilder";

import theme from "theme";

plugins.register([
    imageComponent(),
    cookiePolicyPlugins(),
    typeformPlugins(),
    mailchimpPlugins(),
    gtmPlugins(),
    i18n,
    pageBuilder,
    formBuilder,
    theme()
]);
