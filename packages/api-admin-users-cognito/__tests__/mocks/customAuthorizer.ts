import { ContextPlugin } from "@webiny/api";
import { AdminUsersContext } from "~/types";
import { createGroupAuthorizer } from "@webiny/api-security/plugins/groupAuthorization";

interface Options {
    fullAccess?: boolean;
}

export const customAuthorizer = (opts: Options) => {
    return new ContextPlugin<AdminUsersContext>(context => {
        const groupAuthorizer = createGroupAuthorizer({ identityType: "admin" })(context);
        context.security.addAuthorizer(async () => {
            if (opts.fullAccess) {
                return [{ name: "*" }];
            }

            return groupAuthorizer();
        });
    });
};
