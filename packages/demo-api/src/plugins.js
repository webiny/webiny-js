// @flow
import cms from "webiny-api-cms/plugins";
import cookiePolicy from "webiny-cookie-policy/api";
import googleTagManager from "webiny-google-tag-manager/api";
import mailchimp from "webiny-mailchimp/api";

export default [...cms, ...cookiePolicy, ...googleTagManager, ...mailchimp];
