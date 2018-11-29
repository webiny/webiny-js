// @flow
import cms from "webiny-api-cms/plugins";
import cookiePolicy from "webiny-cookie-policy/api";

export default [...cms, ...cookiePolicy];
