import { ConsoleLinkPlugin } from "@webiny/app/plugins/ConsoleLinkPlugin";
import { NetworkErrorLinkPlugin } from "@webiny/app/plugins/NetworkErrorLinkPlugin";
import { OmitTypenameLinkPlugin } from "@webiny/app/plugins/OmitTypenameLinkPlugin";

export default [
    /**
     * This link removes `__typename` from the variables being sent to the API.
     */
    new OmitTypenameLinkPlugin(),
    /**
     * This link checks for presence of `extensions.console` in the response and logs all items to browser console.
     */
    new ConsoleLinkPlugin(),
    /**
     * This plugin creates an ApolloLink that checks for `NetworkError` and shows an ErrorOverlay in the browser.
     */
    new NetworkErrorLinkPlugin()
];
