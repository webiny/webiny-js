import { ApolloLink } from "apollo-link";
import { Plugin } from "@webiny/plugins";

export abstract class ApolloLinkPlugin extends Plugin {
    constructor() {
        super();
        this.type = "apollo-link";
    }

    abstract createLink(): ApolloLink;
}
