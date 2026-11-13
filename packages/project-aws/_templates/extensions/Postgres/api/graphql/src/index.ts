/**
 * DI-native API GraphQL handler — Postgres variant.
 *
 * The composition root lives in @webiny/api-event-handler-aws-pg (`createAwsPgApiHandler`). The
 * Postgres extension's ReplaceApiLambdaFnHandlers copies this file over the api workspace when
 * `<Infra.Postgres />` is rendered. This file only supplies project-specific extensions.
 *
 * Exports both the buffered (API Gateway) and the response-streaming (Function URL) handler; see the
 * DynamoDB variant of this file for why streaming needs its own Lambda function. The same bundle also
 * answers the `WebinySqlSchemaSetup` event, which the api deploy sends to set the database schema up.
 */
import {
    createAwsPgApiHandler,
    createAwsPgStreamApiHandler
} from "@webiny/api-event-handler-aws-pg";
import { extensions } from "./extensions";

export const handler = createAwsPgApiHandler({ extensions });

export const streamHandler = createAwsPgStreamApiHandler({ extensions });
