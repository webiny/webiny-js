import { ApolloLink } from "@apollo/client/link";
import { plugins } from "@webiny/plugins";
import type { ApolloLinkPlugin } from "./ApolloLinkPlugin.js";

function createLink(plugin: ApolloLinkPlugin) {
    try {
        return plugin.createLink();
    } catch (e) {
        console.error(`Caught an error while executing "createLink" on plugin`, plugin);
        console.error(e);
    }
    return null;
}

export class ApolloDynamicLink extends ApolloLink {
    private cache = new Map();

    public override request(operation: ApolloLink.Operation, forward: ApolloLink.ForwardFunction) {
        const linkPlugins = plugins.byType<ApolloLinkPlugin>("apollo-link");

        if (!linkPlugins.length) {
            return forward(operation);
        }

        const cacheKey = linkPlugins.map(pl => pl.cacheKey).join(",");

        if (!this.cache.has(cacheKey)) {
            /**
             * We filter out falsy items from the linkPlugins because there might be some error while creating link.
             */
            const links = linkPlugins.map(createLink).filter((item): item is ApolloLink => {
                return !!item;
            });
            this.cache.set(cacheKey, ApolloLink.from(links));
        }

        return this.cache.get(cacheKey).request(operation, forward);
    }
}
