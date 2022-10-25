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
import { createMailer } from "@webiny/api-mailer";

export const createApwHeadlessCmsContext = (params: CreateApwContextParams) => {
    return [createHeadlessCms(params)];
};

export const createApwPageBuilderContext = (params: CreateApwContextParams) => {
    return [...createMailer(), createPageBuilder(params)];
};

export const createApwGraphQL = () => {
    return graphql();
};
