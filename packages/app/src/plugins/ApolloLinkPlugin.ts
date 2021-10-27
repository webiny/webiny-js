import { ApolloLink } from "apollo-link";
import { Plugin } from "@webiny/plugins";

interface ApolloLinkFactory {
    (): ApolloLink;
}

export class ApolloLinkPlugin extends Plugin {
    public static readonly type = "apollo-link";
    public readonly cacheKey;
    private factory: ApolloLinkFactory;

    constructor(factory?: ApolloLinkFactory) {
        super();
        this.factory = factory;
        this.cacheKey = Date.now();
    }

    createLink(): ApolloLink {
        if (typeof this.factory === "function") {
            return this.factory();
        }

        throw Error(
            `Missing ApolloLinkFactory in plugin "${this.name}"! Either pass a factory to ApolloLinkPlugin constructor or extend the class and override the "createLink" method.`
        );
    }
}
