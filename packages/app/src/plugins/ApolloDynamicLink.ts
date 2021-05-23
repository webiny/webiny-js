import { ApolloLink } from "apollo-link";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "./ApolloLinkPlugin";

function createLink(plugin: ApolloLinkPlugin) {
    try {
        return plugin.createLink();
    } catch (e) {
        console.error(`Caught an error while executing "createLink" on plugin`, plugin);
        console.error(e);
    }
}

export class ApolloDynamicLink extends ApolloLink {
    private cache = new Map();

    request(operation, forward) {
        const linkPlugins = plugins.byType<ApolloLinkPlugin>("apollo-link");

        if (!linkPlugins.length) {
            return forward(operation);
        }

        const cacheKey = linkPlugins.map(pl => pl.name).join(",");

        if (!this.cache.has(cacheKey)) {
            this.cache.set(cacheKey, ApolloLink.from(linkPlugins.map(createLink)));
        }

        return this.cache.get(cacheKey).request(operation, forward);
    }
}
