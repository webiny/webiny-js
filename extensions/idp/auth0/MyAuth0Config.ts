import { Auth0IdpConfig } from "@webiny/auth0";

class MyIdpConfig implements Auth0IdpConfig.Interface {
    getIdentity(token: Auth0IdpConfig.JwtPayload) {
        return {
            id: String(token["sub"]),
            type: "admin",
            displayName: token["name"],
            // User profile on this tenant
            roles: ["full-access"],
            profile: {
                firstName: token["given_name"],
                lastName: token["family_name"],
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

const MyAuth0Config = Auth0IdpConfig.createImplementation({
    implementation: MyIdpConfig,
    dependencies: []
});

export default MyAuth0Config;
