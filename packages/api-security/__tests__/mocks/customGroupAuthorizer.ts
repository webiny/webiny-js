import { SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/handler";

export const customGroupAuthorizer = () => {
    return new ContextPlugin<SecurityContext>(({ security }) => {
        security.addAuthorizer(async () => {
            const identity = security.getIdentity();
            if (identity && identity["group"] === "full-access") {
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
