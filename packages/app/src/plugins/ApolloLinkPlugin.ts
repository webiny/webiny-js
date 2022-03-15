import { ApolloLink } from "apollo-link";
import { nanoid } from "nanoid";
import { Plugin } from "@webiny/plugins";

interface ApolloLinkFactory {
    (): ApolloLink;
}

export class ApolloLinkPlugin extends Plugin {
    public static override readonly type: string = "apollo-link";
    public readonly cacheKey;
    private readonly factory?: ApolloLinkFactory;
    private cache?: ApolloLink;

    constructor(factory?: ApolloLinkFactory) {
        super();
        this.factory = factory;
        this.cacheKey = nanoid();
    }

    public createLink(): ApolloLink {
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
