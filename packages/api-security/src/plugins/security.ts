import authenticateJwt from "./authentication/authenticateJwt";
import authenticatePat from "./authentication/authenticatePat";
import { SecurityPlugin } from "@webiny/api-security/types";

export default options => [
    {
        type: "graphql-security",
        name: "graphql-security-jwt",
        authenticate: authenticateJwt
    } as SecurityPlugin,
    {
        type: "graphql-security",
        name: "graphql-security-pat",
        authenticate: authenticatePat(options)
    } as SecurityPlugin
];
