/**
 * We have separated context and GraphQL creation so user can initialize only context if required.
 * GraphQL will not work without context, but context will without GraphQL.
 */
import graphql from "~/plugins/graphql";
import context from "./plugins/context";

export const createApwContext = () => {
    return context();
};

export const createApwGraphQL = () => {
    return graphql();
};
