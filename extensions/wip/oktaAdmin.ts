import { createImplementation } from "@webiny/di-container";
import { ApiBeforeBuild, UiService } from "@webiny/extensions/project";
import type Okta from "@webiny/okta";

class MyOktaIdentityProvider implements Okta.Admin.Interface {
    constructor(private ui: UiService.Interface) {}

    // isAutoLogin (() => {
    //     const query = new URLSearchParams(window.location.search);
    //     return query.get("action") !== "logout";
    // })(), // evaluated once, value is true/false

    getDomain() {
        return String(process.env.REACT_APP_OKTA_DOMAIN);
    }
    getClientId() {
        return String(process.env.REACT_APP_OKTA_CLIENT_ID);
    }

    // getRootAppClientId: String(process.env.REACT_APP_OKTA_CLIENT_ID),
    //
    // getLogoutParams: {
    //     returnTo: window.location.origin + "?action=logout"
    // },
}

export default createImplementation({
    abstraction: ApiBeforeBuild,
    implementation: MyApiBeforeBuild,
    dependencies: [UiService]
});
