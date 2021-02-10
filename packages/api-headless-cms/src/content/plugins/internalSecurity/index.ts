import { SecurityIdentity } from "@webiny/api-security";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

const identityType = "read-api-key";

export default () => [
    {
        type: "security-authentication",
        async authenticate(context: CmsContext) {
            const { headers } = context.http.request;
            const header = headers["Authorization"] || headers["authorization"];
            const token = header ? header.split(" ").pop() : null;
            if (!token || token !== context.cms.getSettings().readAPIKey) {
                return;
            }

            return new SecurityIdentity({
                id: "read-api-key",
                displayName: "Read API key",
                type: identityType,
                permissions: [{ name: "cms.endpoint.read" }, { name: "cms.content*" }]
            });
        }
    },
    {
        type: "security-authorization",
        name: "security-authorization-read-api-key",
        async getPermissions({ security }: SecurityContext & TenancyContext) {
            const identity = security.getIdentity();

            if (!identity || identity.type !== identityType) {
                return;
            }

            // Return permissions we defined in the authentication plugin.
            return identity.permissions;
        }
    }
];
