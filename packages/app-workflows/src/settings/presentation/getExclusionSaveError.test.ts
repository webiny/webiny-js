import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { getExclusionSaveError } from "~/settings/presentation/getExclusionSaveError.js";

describe("getExclusionSaveError (R325, Q68.2)", () => {
    it("shows the server's message for a server error", () => {
        const error = new GraphQLOperationError({
            message: "This user is already in the list. Edit it instead.",
            code: SettingsErrorCode.Validation
        });

        expect(getExclusionSaveError(error)).toBe(
            "Could not save: This user is already in the list. Edit it instead."
        );
    });

    it("shows the server's message for NotAuthorized too", () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: SettingsErrorCode.NotAuthorized
        });

        expect(getExclusionSaveError(error)).toBe("Could not save: Not authorized.");
    });

    it("shows the standard alert for a transport failure", () => {
        expect(getExclusionSaveError(new Error("Network down."))).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(getExclusionSaveError("boom")).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
    });
});
