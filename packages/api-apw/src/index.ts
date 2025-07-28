/**
 * We have separated context and GraphQL creation so user can initialize only context if required.
 * GraphQL will not work without context, but context will without GraphQL.
 */
import graphql from "~/plugins/graphql";
import { createApwPageBuilderContext as createPageBuilder } from "./plugins/context";
import { CreateApwContextParams } from "./scheduler/types";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";

export const createApwPageBuilderContext = (params: CreateApwContextParams) => {
    return [...createMailerContext(), ...createMailerGraphQL(), createPageBuilder(params)];
};

export const createApwGraphQL = () => {
    return [graphql()];
};
