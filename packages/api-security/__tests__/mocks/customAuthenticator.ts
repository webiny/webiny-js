import { SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/handler";
import { FastifyContext } from "@webiny/fastify/types";

interface Context extends FastifyContext, SecurityContext {}

export const customAuthenticator = () => {
    return new ContextPlugin<Context>(context => {
        /**
         * TODO @pavel can we return null?
         */
        // @ts-ignore
        context.security.addAuthenticator(async () => {
            if ("authorization" in context.request.headers) {
                return;
            }

            return {
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                group: "full-access"
            };
        });
    });
};
