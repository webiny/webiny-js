import { InMemoryCache as BaseInMemoryCache, InMemoryCacheConfig } from "apollo-cache-inmemory";
import { DocumentNode } from "graphql";
import { plugins } from "@webiny/plugins";
import { AddQuerySelectionPlugin } from "../plugins/AddQuerySelectionPlugin";
import { ApolloLinkPlugin } from "../plugins/ApolloLinkPlugin";

export class InMemoryCache extends BaseInMemoryCache {
    private readonly transformPlugins: AddQuerySelectionPlugin[];

    constructor(config?: InMemoryCacheConfig) {
        super(config);

        this.transformPlugins = plugins
            .byType<AddQuerySelectionPlugin>(ApolloLinkPlugin.type)
            .filter(pl => pl instanceof AddQuerySelectionPlugin);
    }

    public override transformDocument(document: DocumentNode): DocumentNode {
        // @ts-expect-error
        const operationName = document.definitions[0].name.value;

        for (const pl of this.transformPlugins) {
            pl.addSelectionToQuery(operationName, document);
        }

        return super.transformDocument(document);
    }
}
