import { describe, expect, it } from "vitest";
import { BaseError } from "@webiny/feature/api";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";

class CodedError extends BaseError {
    override readonly code = "Workflows/Coded" as const;

    public constructor() {
        super({ message: "secret@webiny.test is not allowed." });
    }
}

describe("getErrorLogFields (R196)", () => {
    it("returns the code and the name of an error that has them", () => {
        const error = Object.assign(new Error("boom"), { code: "ECONNRESET" });

        expect(getErrorLogFields(error)).toEqual({ errorCode: "ECONNRESET", errorName: "Error" });
    });

    it("returns the code of a BaseError subclass, and the name it reports", () => {
        expect(getErrorLogFields(new CodedError())).toEqual({
            errorCode: "Workflows/Coded",
            errorName: "Error"
        });
    });

    it("never returns a message", () => {
        expect(JSON.stringify(getErrorLogFields(new CodedError()))).not.toContain("secret@");
    });

    it("returns undefined for a code or name that is not a string", () => {
        expect(
            getErrorLogFields({ code: { address: "anna@webiny.test" }, name: ["anna@webiny.test"] })
        ).toEqual({ errorCode: undefined, errorName: undefined });
    });

    it("returns undefined for values that are not objects", () => {
        expect(getErrorLogFields("boom")).toEqual({ errorCode: undefined, errorName: undefined });
        expect(getErrorLogFields(null)).toEqual({ errorCode: undefined, errorName: undefined });
        expect(getErrorLogFields(undefined)).toEqual({
            errorCode: undefined,
            errorName: undefined
        });
    });
});
