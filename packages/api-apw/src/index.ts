/**
 * We have separated context and GraphQL creation so user can initialize only context if required.
 * GraphQL will not work without context, but context will without GraphQL.
 */
import graphql from "~/plugins/graphql";
import {
    createApwHeadlessCmsContext as createHeadlessCms,
    createApwPageBuilderContext as createPageBuilder
} from "./plugins/context";
import { CreateApwContextParams } from "./scheduler/types";

export const createApwHeadlessCmsContext = (params: CreateApwContextParams) => {
    return createHeadlessCms(params);
};

export const createApwPageBuilderContext = (params: CreateApwContextParams) => {
    return createPageBuilder(params);
};

export const createApwGraphQL = () => {
    return graphql();
};
