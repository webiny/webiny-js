import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { isRecord } from "~/editor/model/isRecord.js";

export interface ValidationFailure {
    kind: "validation";
    message: string;
    stepId: string | null;
    field: string | null;
    workflowId: string | null;
    ruleId: string | null;
}

export interface ConflictFailure {
    kind: "conflict";
    savedByName: string;
}

export interface NotFoundFailure {
    kind: "notFound";
}

// Any other error the server answered with: only its message is shown.
export interface ServerFailure {
    kind: "server";
    message: string;
}

// The request did not get an answer: a plain `Error` from the transport.
export interface TransportFailure {
    kind: "transport";
}

export type SaveFailure =
    | ValidationFailure
    | ConflictFailure
    | NotFoundFailure
    | ServerFailure
    | TransportFailure;

const FALLBACK_SAVED_BY = "Someone";

function readString(source: Record<string, unknown>, key: string): string | null {
    const value = source[key];
    return typeof value === "string" && value !== "" ? value : null;
}

function mapValidation(error: GraphQLOperationError): ValidationFailure {
    const data = isRecord(error.data) ? error.data : {};

    return {
        kind: "validation",
        message: error.message,
        stepId: readString(data, "stepId"),
        field: readString(data, "field"),
        workflowId: readString(data, "workflowId"),
        ruleId: readString(data, "ruleId")
    };
}

function mapConflict(error: GraphQLOperationError): ConflictFailure {
    const data = isRecord(error.data) ? error.data : {};
    const savedBy = isRecord(data.savedBy) ? data.savedBy : {};
    const name = readString(savedBy, "displayName");

    return { kind: "conflict", savedByName: name ?? FALLBACK_SAVED_BY };
}

/*
 * Maps what a failed store call threw to what the presenter does about it (R267, R276). The use
 * cases throw `GraphQLOperationError` for a server error (`code` is a `WorkflowErrorCode`, `data`
 * is the server's data) and let a transport `Error` pass (R204).
 */
export const mapSaveError = (error: unknown): SaveFailure => {
    if (!(error instanceof GraphQLOperationError)) {
        return { kind: "transport" };
    }
    if (error.code === WorkflowErrorCode.Validation) {
        return mapValidation(error);
    }
    if (error.code === WorkflowErrorCode.Conflict) {
        return mapConflict(error);
    }
    if (error.code === WorkflowErrorCode.NotFound) {
        return { kind: "notFound" };
    }
    return { kind: "server", message: error.message };
};
