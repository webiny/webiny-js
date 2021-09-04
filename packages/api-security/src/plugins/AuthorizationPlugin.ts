import { Plugin } from "@webiny/plugins";
import { SecurityPermission } from "../types";
import { Security } from "../Security";

export abstract class AuthorizationPlugin extends Plugin {
    public static readonly type = "security-authorization";

    abstract getPermissions(security: Security): Promise<SecurityPermission[]>;
}
