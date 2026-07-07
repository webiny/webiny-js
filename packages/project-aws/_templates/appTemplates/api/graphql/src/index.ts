/**
 * DI-native API GraphQL handler (DynamoDB storage).
 *
 * The composition root lives in @webiny/api-event-handler-aws-ddb (`createWebinyApiHandler`) so the wiring
 * is a real, testable package rather than template code. This file only supplies project-specific
 * extensions.
 */
import { createWebinyApiHandler } from "@webiny/api-event-handler-aws-ddb";
import { extensions } from "./extensions";

export const handler = createWebinyApiHandler({ extensions });
