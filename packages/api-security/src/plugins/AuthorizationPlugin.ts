import { Plugin } from "@webiny/plugins";
import { SecurityContext, SecurityPermission } from "../types";

export abstract class AuthorizationPlugin extends Plugin {
    public static readonly type = "security-authorization";

    abstract getPermissions(context: SecurityContext): Promise<SecurityPermission[]>;
}
