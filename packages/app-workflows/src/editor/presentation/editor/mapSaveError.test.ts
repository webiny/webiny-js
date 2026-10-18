import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowErrorCode } from "~/editor/domain/WorkflowErrorCode.js";
import { mapSaveError } from "./mapSaveError.js";

const operationError = (code: string, data: unknown = null, message = "Failed."): Error => {
    return new GraphQLOperationError({ message, code, data });
};

describe("mapSaveError (R267, R276)", () => {
    it("reads the validation data", () => {
        const error = operationError(
            WorkflowErrorCode.Validation,
            { stepId: "step-1", field: "config.teams", workflowId: null },
            "Step needs a team."
        );

        expect(mapSaveError(error)).toEqual({
            kind: "validation",
            message: "Step needs a team.",
            stepId: "step-1",
            field: "config.teams",
            workflowId: null
        });
    });

    it("reads the other workflow's id of a duplicate-model error", () => {
        const error = operationError(WorkflowErrorCode.Validation, {
            stepId: null,
            field: "models",
            workflowId: "workflow-9"
        });

        expect(mapSaveError(error)).toMatchObject({
            kind: "validation",
            stepId: null,
            field: "models",
            workflowId: "workflow-9"
        });
    });

    it("treats missing or malformed validation data as nulls", () => {
        expect(mapSaveError(operationError(WorkflowErrorCode.Validation))).toMatchObject({
            kind: "validation",
            stepId: null,
            field: null,
            workflowId: null
        });
        const malformed = operationError(WorkflowErrorCode.Validation, {
            stepId: 5,
            field: {},
            workflowId: ""
        });
        expect(mapSaveError(malformed)).toMatchObject({
            stepId: null,
            field: null,
            workflowId: null
        });
    });

    it("names who saved the newer version of a conflict, else Someone (Q43)", () => {
        const named = operationError(WorkflowErrorCode.Conflict, {
            savedOn: "2026-10-18T10:00:00.000Z",
            savedBy: { id: "user-2", displayName: "Grace Hopper" }
        });
        const anonymous = operationError(WorkflowErrorCode.Conflict, { savedOn: "x" });
        const empty = operationError(WorkflowErrorCode.Conflict, { savedBy: { displayName: "" } });

        expect(mapSaveError(named)).toEqual({ kind: "conflict", savedByName: "Grace Hopper" });
        expect(mapSaveError(anonymous)).toEqual({ kind: "conflict", savedByName: "Someone" });
        expect(mapSaveError(empty)).toEqual({ kind: "conflict", savedByName: "Someone" });
    });

    it("maps NotFound", () => {
        expect(mapSaveError(operationError(WorkflowErrorCode.NotFound, { id: "w" }))).toEqual({
            kind: "notFound"
        });
    });

    it("maps every other server error to its message", () => {
        const persistence = operationError(WorkflowErrorCode.Persistence, null, "Disk full.");
        const unknown = operationError("Something/Else", null, "Odd.");

        expect(mapSaveError(persistence)).toEqual({ kind: "server", message: "Disk full." });
        expect(mapSaveError(unknown)).toEqual({ kind: "server", message: "Odd." });
    });

    it("maps a plain error and anything else to a transport failure", () => {
        expect(mapSaveError(new Error("Failed to fetch"))).toEqual({ kind: "transport" });
        expect(mapSaveError("boom")).toEqual({ kind: "transport" });
    });
});
