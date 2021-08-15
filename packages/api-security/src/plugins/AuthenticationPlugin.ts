import { Plugin } from "@webiny/plugins";
import { SecurityIdentity } from "../types";
import { Context } from "@webiny/handler/types";

export abstract class AuthenticationPlugin<TContext = Context> extends Plugin {
    public static readonly type = "security-authentication";

    abstract authenticate(context: TContext): Promise<undefined | SecurityIdentity>;
}
