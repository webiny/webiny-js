/**
 * We have separated context and GraphQL creation so user can initialize only context if required.
 * GraphQL will not work without context, but context will without GraphQL.
 */
import graphql from "~/plugins/graphql";
import context from "./plugins/context";
import { CreateApwContextParams } from "./scheduler/types";

export const createApwContext = (params: CreateApwContextParams) => {
    return context(params);
};

export const createApwGraphQL = () => {
    return graphql();
};
