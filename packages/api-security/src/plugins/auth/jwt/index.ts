import authenticateJwt from "./authenticateJwt";
import get from "lodash/get";

import {
    SecurityAuthenticationPlugin,
} from "@webiny/api-security/types";

export type JwtAuthOptions = {
    secret: string;
};

export default (options: JwtAuthOptions) => [
    {
        type: "authentication",
        name: "authentication-jwt",
        authenticate: context => authenticateJwt({ context, options }),
    } as SecurityAuthenticationPlugin
];
