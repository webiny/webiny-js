import type { SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/api";

export const customGroupAuthorizer = () => {
    return new ContextPlugin<SecurityContext>(({ security }) => {
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            if (identity && identity.groups.includes("full-access")) {
                return [
                    {
                        name: "*"
                    }
                ];
            }
            return null;
        });
    });
};
