import { BuildParams } from "@webiny/app-admin/features/buildParams/index.js";
import {
    CognitoSignInConfig,
    type ICognitoSignInConfig
} from "./presentation/Cognito/CognitoSignInConfig.js";

interface FederationBuildParam {
    callbackUrls: string[];
    logoutUrls: string[];
    responseType: "code" | "token";
    allowCredentialsLogin: boolean;
    providers: { name: string; label: string }[];
}

class DefaultCognitoSignInConfigImpl implements ICognitoSignInConfig {
    constructor(private buildParams: BuildParams.Interface) {}

    async getConfig() {
        const config = this.buildParams.get<FederationBuildParam>("cognitoFederation");

        if (!config) {
            return {
                oauth: {
                    scopes: ["profile", "email", "openid"],
                    redirectSignIn: [window.location.origin],
                    redirectSignOut: [window.location.origin],
                    responseType: "code" as const
                },
                allowCredentialsLogin: true,
                providers: []
            };
        }

        return {
            oauth: {
                scopes: ["profile", "email", "openid"],
                redirectSignIn: config.callbackUrls,
                redirectSignOut: config.logoutUrls,
                responseType: config.responseType
            },
            allowCredentialsLogin: config.allowCredentialsLogin,
            providers: config.providers
        };
    }
}

export const DefaultCognitoSignInConfig = CognitoSignInConfig.createImplementation({
    implementation: DefaultCognitoSignInConfigImpl,
    dependencies: [BuildParams]
});
