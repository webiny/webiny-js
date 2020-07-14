import models from "./models";
import graphql from "./graphql";
// import security from "./security";
// import { SecurityOptions } from "../types";

export default options => [
    models(),
    graphql
    // security(options),
    // securityAuthenticationPlugins(), // context da
    // securityAuthJwtPlugins({
    // //ovdje je has-scope plugin + authN
    //    secret: JWT_TOKEN_SIGN_SECRET
    // })
];
