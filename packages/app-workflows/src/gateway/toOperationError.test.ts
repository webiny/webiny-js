import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { toOperationError } from "./toOperationError.js";

describe("toOperationError", () => {
    it("keeps the message, the code and the data of the envelope error", () => {
        const data = { stepId: "step-1", field: "title", workflowId: null };

        const error = toOperationError({
            code: "Workflows/Workflow/Validation",
            message: "Step needs a title.",
            data
        });

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("Step needs a title.");
        expect(error.code).toBe("Workflows/Workflow/Validation");
        expect(error.data).toBe(data);
    });

    it("falls back to a message and null code and data when the error has none", () => {
        const error = toOperationError({ code: null, message: null, data: null });

        expect(error.message).toBe("The request failed.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("answers the fallback error when the envelope has no error at all", () => {
        const error = toOperationError(null);

        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.message).toBe("The request failed.");
        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("keeps the rule id of a validation error in the data (R288)", () => {
        const data = {
            stepId: "step-1",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "r-1"
        };

        const error = toOperationError({
            code: "Workflows/Workflow/Validation",
            message: "The target user is not a member of the step's teams.",
            data
        });

        expect(error.data).toEqual(data);
    });
});
