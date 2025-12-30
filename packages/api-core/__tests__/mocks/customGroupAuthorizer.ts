import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";

export const customGroupAuthorizer = () => {
    return new ContextPlugin<ApiCoreContext>(({ security }) => {
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            if (identity && identity.context.groups.includes("full-access")) {
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
