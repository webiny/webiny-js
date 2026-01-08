import { OktaIdpConfig } from "@webiny/okta";

class MyIdpConfig implements OktaIdpConfig.Interface {
    getIdentity(token: OktaIdpConfig.JwtPayload) {
        return {
            id: String(token["sub"]),
            displayName: token["name"],
            roles: [token["webiny_group"]],
            teams: [token["team"]].filter(Boolean),
            // User profile on this tenant
            profile: {
                firstName: token["first_name"],
                lastName: token["last_name"],
                email: token["email"]
            },
            // For all other runtime data. This is not stored in the database.
            context: {
                canAccessTenant: true,
                defaultTenant: "root"
            }
        };
    }
}

export const MyOktaConfig = OktaIdpConfig.createImplementation({
    implementation: MyIdpConfig,
    dependencies: []
});
