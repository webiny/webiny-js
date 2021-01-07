import { createHandler } from "@webiny/handler-aws";
import graphqlPlaygroundHandler from "@webiny/handler-graphql-playground";

export const handler = createHandler(graphqlPlaygroundHandler());
