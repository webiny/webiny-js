import type { JwtPayload } from "jsonwebtoken";
import type { IdentityData } from "@webiny/api-core/idp";
import { CognitoIdpConfig as CognitoIdpConfigAbstraction } from "./abstractions.js";

class CognitoIdpConfigImpl implements CognitoIdpConfigAbstraction.Interface {
    getIdentity(token: JwtPayload): IdentityData {
        const customId = token["custom:id"] as string | undefined;
        const givenName = token["given_name"] as string | undefined;
        const familyName = token["family_name"] as string | undefined;
        const email = token["email"] as string | undefined;

        return {
            id: customId || token.sub || "",
            type: "admin",
            displayName: `${givenName || ""} ${familyName || ""}`.trim() || email || "Unknown User",
            profile: {
                email: email || "",
                firstName: givenName || "",
                lastName: familyName || "",
            }
        };
    }
}

export const CognitoIdpConfig = CognitoIdpConfigAbstraction.createImplementation({
    implementation: CognitoIdpConfigImpl,
    dependencies: []
});
