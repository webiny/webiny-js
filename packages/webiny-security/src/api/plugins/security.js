// @flow
import type { SecurityPluginType } from "webiny-security/api/types";
import authenticate from "./authentication/authenticate";

export default ([{ type: "security", name: "security", authenticate }]: Array<SecurityPluginType>);
