import { CognitoIdpConfig } from "@webiny/cognito/api";

class EntraIdConfig implements CognitoIdpConfig.Interface {
    getIdentity(_token: CognitoIdpConfig.JwtPayload) {
        return {
            roles: ["full-access"],
            teams: []
        };
    }
}

export default CognitoIdpConfig.createImplementation({
    implementation: EntraIdConfig,
    dependencies: []
});
