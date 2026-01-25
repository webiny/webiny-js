import { ConsoleLinkPlugin } from "@webiny/app/plugins/ConsoleLinkPlugin.js";
import { NetworkErrorLinkPlugin } from "@webiny/app/plugins/NetworkErrorLinkPlugin.js";
import { OmitTypenameLinkPlugin } from "@webiny/app/plugins/OmitTypenameLinkPlugin.js";
import { Container } from "@webiny/di";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";

export default (container: Container) => [
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
    new NetworkErrorLinkPlugin(() => container.resolve(EventPublisher))
];
