import { ApolloLink } from "apollo-link";
import { Plugin } from "@webiny/plugins";

export abstract class ApolloLinkPlugin extends Plugin {
    public static readonly type = "apollo-link";

    abstract createLink(): ApolloLink;
}
