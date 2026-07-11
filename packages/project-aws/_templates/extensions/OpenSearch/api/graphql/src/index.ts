/**
 * DI-native API GraphQL handler — OpenSearch (DDB+ES) variant.
 *
 * The composition root lives in @webiny/api-event-handler-aws-ddb-os (`createAwsDdbOsApiHandler`) so the
 * wiring is a real, testable package rather than template code. The OpenSearch extension's
 * ReplaceApiLambdaFnHandlers copies this file over the api workspace when OpenSearch is enabled.
 * This file only supplies project-specific extensions.
 */
import { createAwsDdbOsApiHandler } from "@webiny/api-event-handler-aws-ddb-os";
import { extensions } from "./extensions";

export const handler = createAwsDdbOsApiHandler({ extensions });
