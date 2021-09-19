import { AuthenticationPlugin } from "~/plugins/AuthenticationPlugin";
import { SecurityIdentity } from "~/SecurityIdentity";
import { SecurityContext } from "~/types";
import { HttpContext } from "@webiny/handler-http/types";

interface Context extends HttpContext, SecurityContext {}

export class CustomAuthenticationPlugin extends AuthenticationPlugin<SecurityContext> {
    async authenticate(context: Context): Promise<SecurityIdentity | undefined> {
        if ("Authorization" in context.http.request.headers) {
            return;
        }

        return new SecurityIdentity({
            id: "123456789",
            displayName: "John Doe",
            type: "admin",
            group: "full-access"
        });
    }
}
