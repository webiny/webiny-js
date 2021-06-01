import { Plugin } from "@webiny/plugins";
import { SecurityContext, SecurityIdentity } from "../types";

export abstract class AuthenticationPlugin extends Plugin {
    public static readonly type = "security-authentication";

    abstract authenticate(context: SecurityContext): Promise<undefined> | Promise<SecurityIdentity>;
}
