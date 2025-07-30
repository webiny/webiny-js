/**
 * We have separated context and GraphQL creation so user can initialize only context if required.
 * GraphQL will not work without context, but context will without GraphQL.
 */
import graphql from "~/plugins/graphql";
import { createApwContext as createBaseApwContext } from "./plugins/context";
import type { CreateApwContextParams } from "./scheduler/types";
import { createMailerContext, createMailerGraphQL } from "@webiny/api-mailer";

export const createApwContext = (params: CreateApwContextParams) => {
    return [...createMailerContext(), ...createMailerGraphQL(), createBaseApwContext(params)];
};

export const createApwGraphQL = () => {
    return [graphql()];
};
