import { Plugin } from "@webiny/plugins";
import { Context } from "@webiny/handler/types";
import { Identity } from "~/Identity";

export abstract class AuthenticationPlugin<TContext = Context> extends Plugin {
    public static readonly type = "security-authentication";

    abstract authenticate(context: TContext): Promise<undefined | Identity>;
}
