import { ApolloLink } from "apollo-link";
import { nanoid } from "nanoid";
import { Plugin } from "@webiny/plugins";

interface ApolloLinkFactory {
    (): ApolloLink;
}

export class ApolloLinkPlugin extends Plugin {
    public static readonly type = "apollo-link";
    public readonly cacheKey;
    private factory: ApolloLinkFactory;
    private cache;

    constructor(factory?: ApolloLinkFactory) {
        super();
        this.factory = factory;
        this.cacheKey = nanoid();
    }

    createLink(): ApolloLink {
        if (this.cache) {
            return this.cache;
        }

        if (typeof this.factory === "function") {
            this.cache = this.factory();

            return this.cache;
        }

        throw Error(
            `Missing ApolloLinkFactory in plugin "${this.name}"! Either pass a factory to ApolloLinkPlugin constructor or extend the class and override the "createLink" method.`
        );
    }
}
