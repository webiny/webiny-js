import { createImplementation } from "@webiny/di-container";
import { ApiBeforeBuild, UiService } from "@webiny/extensions/project";
import type Okta from "@webiny/okta";

class MyOktaIdentityProvider implements Okta.Backend.Interface {
    constructor(private ui: UiService.Interface) {}

    getIdentity() {} // backend

    //
    execute(params: ApiBeforeBuild.Params) {
        return {
            autoLogin: (() => {
                const query = new URLSearchParams(window.location.search);
                return query.get("action") !== "logout";
            })(), // evaluated once, value is true/false

            okta: {
                domain: String(process.env.REACT_APP_OKTA_DOMAIN),
                clientId: String(process.env.REACT_APP_OKTA_CLIENT_ID)
            },

            rootAppClientId: String(process.env.REACT_APP_OKTA_CLIENT_ID),

            logoutParams: {
                returnTo: window.location.origin + "?action=logout"
            },
            getIdentity: () => {  }
        };
    }
}

export default createImplementation({
    abstraction: ApiBeforeBuild,
    implementation: MyApiBeforeBuild,
    dependencies: [UiService]
});
