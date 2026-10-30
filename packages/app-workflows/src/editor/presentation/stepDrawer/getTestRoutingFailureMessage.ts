import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { TEST_ROUTING_MESSAGES } from "./testRoutingMessages.js";

/*
 * The failure text of a Test routing run (R300, R306): a Validation error carries the server's
 * message (a rule without a target, a target outside the teams); a transport failure and any other
 * server error, `NotAuthorized` included, show that the server did not respond. Pure.
 */
export const getTestRoutingFailureMessage = (error: unknown): string => {
    if (error instanceof GraphQLOperationError && error.code === WorkflowErrorCode.Validation) {
        return `${TEST_ROUTING_MESSAGES.failedPrefix}${error.message}`;
    }
    return TEST_ROUTING_MESSAGES.noResponse;
};
