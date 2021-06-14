import { Plugin } from "@webiny/plugins";
import { SecurityIdentity } from "../types";

export abstract class AuthenticationPlugin extends Plugin {
    public static readonly type = "security-authentication";

    abstract authenticate(context: any): Promise<undefined | SecurityIdentity>;
}
