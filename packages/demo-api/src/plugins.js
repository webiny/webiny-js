// @flow
import cms from "webiny-api-cms/plugins";
import cookiePolicy from "webiny-cookie-policy/api";
import googleTagManager from "webiny-google-tag-manager/api";
import mailchimpPlugins from "webiny-mailchimp/api/plugins";

export default [...cms, ...cookiePolicy, ...googleTagManager, ...mailchimpPlugins];
