import { AuthenticationPlugin } from "@webiny/api-security/plugins/AuthenticationPlugin";
import { SecurityIdentity } from "@webiny/api-security";
import { CmsContext } from "~/types";

export class InternalAuthenticationPlugin extends AuthenticationPlugin {
    private _identityType: string;

    constructor(identityType: string) {
        super();

        this._identityType = identityType;
    }

    async authenticate(context: CmsContext): Promise<undefined | SecurityIdentity> {
        const { headers } = context.http.request;
        const header = headers["Authorization"] || headers["authorization"];
        const apiKey = header ? header.split(" ").pop() : null;
        if (!apiKey || apiKey !== (await context.cms.system.getReadAPIKey())) {
            return;
        }

        /**
         * This is an internal identity, which has access to `read` endpoint, all content models,
         * content entries, and all content locales.
         */
        return new SecurityIdentity({
            id: "read-api-key",
            displayName: "Read API key",
            type: this._identityType,
            permissions: [
                { name: "cms.endpoint.read" },
                { name: "cms.content*" },
                { name: "content.i18n" }
            ]
        });
    }
}
