import type { DocumentNode } from "graphql";
import { ApolloLink } from "@apollo/client";
import { plugins } from "@webiny/plugins";
import { AddQuerySelectionPlugin } from "../plugins/AddQuerySelectionPlugin.js";
import { ApolloLinkPlugin } from "../plugins/ApolloLinkPlugin.js";

export class TransformDocumentLink extends ApolloLink {
    private readonly transformPlugins: AddQuerySelectionPlugin[];

    constructor() {
        super();

        this.transformPlugins = plugins
            .byType<AddQuerySelectionPlugin>(ApolloLinkPlugin.type)
            .filter(pl => pl instanceof AddQuerySelectionPlugin);
    }

    public override request(operation: any, nextLink: any) {
        const document = operation.query as DocumentNode;
        // @ts-expect-error
        const operationName = document.definitions[0].name.value;

        for (const pl of this.transformPlugins) {
            pl.addSelectionToQuery(operationName, document);
        }

        return nextLink(operation);
    }
}
