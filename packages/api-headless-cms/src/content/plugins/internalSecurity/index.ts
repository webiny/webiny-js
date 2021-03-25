import { SecurityIdentity } from "@webiny/api-security";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { CmsContext } from "~/types";
import { defaults } from "~/utils";

const identityType = "read-api-key";

const getReadAPIKey = async ({ db, security }: CmsContext) => {
    const [[system]] = await db.read({
        ...defaults.db(),
        query: { PK: `T#${security.getTenant().id}#SYSTEM`, SK: "CMS" }
    });

    return system.readAPIKey;
};

export default () => [
    {
        type: "security-authentication",
        async authenticate(context: CmsContext) {
            const { headers } = context.http.request;
            const header = headers["Authorization"] || headers["authorization"];
            const token = header ? header.split(" ").pop() : null;
            if (!token || token !== (await getReadAPIKey(context))) {
                return;
            }

            /**
             * This is an internal identity, which has access to `read` endpoint, all content models,
             * content entries, and all content locales.
             */
            return new SecurityIdentity({
                id: "read-api-key",
                displayName: "Read API key",
                type: identityType,
                permissions: [
                    { name: "cms.endpoint.read" },
                    { name: "cms.content*" },
                    { name: "content.i18n" }
                ]
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
