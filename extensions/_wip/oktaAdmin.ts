import { createImplementation } from "@webiny/di";
import { ApiBeforeBuild, UiService } from "webiny/infra";
import type Okta from "@webiny/okta";

class MyOktaIdentityProvider implements Okta.Admin.Interface {
    constructor(private ui: UiService.Interface) {}

    getAuth() {
        return new OktaAuth({
            issuer: process.env.OKTA_ISSUER,
            clientId: process.env.OKTA_CLIENT_ID,
            redirectUri: window.location.origin + "/",
            scopes: ["openid", "email", "profile"],
            pkce: true,
            restoreOriginalUri: undefined,
            devMode: false
        });
    }
}

export default createImplementation({
    abstraction: ApiBeforeBuild,
    implementation: MyApiBeforeBuild,
    dependencies: [UiService]
});
