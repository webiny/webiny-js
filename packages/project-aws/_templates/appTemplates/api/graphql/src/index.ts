/**
 * DI-native API GraphQL handler.
 *
 * The composition root lives in @webiny/api-infra-aws (`createWebinyApiHandler`) so the wiring is
 * a real, testable package rather than template code. This file only supplies project-specific
 * extensions.
 */
import { createWebinyApiHandler } from "@webiny/api-infra-aws";
import { extensions } from "./extensions";

export const handler = createWebinyApiHandler({ extensions });
