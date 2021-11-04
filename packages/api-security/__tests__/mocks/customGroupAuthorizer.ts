import { SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

export const customGroupAuthorizer = () => {
    return new ContextPlugin<SecurityContext>(({ security }) => {
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            if (identity && identity["group"] === "full-access") {
                return [{ name: "*" }];
            }
        });
    });
};
