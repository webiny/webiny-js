import { validateSystemInput } from "~/sync/utils/validateSystemInput.js";

describe("validateSystemInput", () => {
    it("should return system info when input is valid", () => {
        const result = validateSystemInput({
            name: "test#blue",
            env: "test",
            variant: "blue",
            version: "0.0.1",
            region: "eu-central-1"
        });

        expect(result).toEqual({
            system: {
                name: "test#blue",
                env: "test",
                variant: "blue",
                version: "0.0.1",
                region: "eu-central-1"
            }
        });
    });

    it("should return an error when missing env", () => {
        const result = validateSystemInput({
            name: "test#blue",
            variant: "blue",
            version: "0.0.1",
            region: "eu-central-1"
        });

        expect(result).toEqual({
            error: "Sync System: No environment variable provided. Sync System will not be attached."
        });
    });

    it("should return an error when missing region", () => {
        const result = validateSystemInput({
            name: "test#blue",
            env: "test",
            variant: "blue",
            version: "0.0.1"
        });

        expect(result).toEqual({
            error: "Sync System: No region variable provided. Sync System will not be attached."
        });
    });

    it("should return an error when missing version", () => {
        const result = validateSystemInput({
            name: "test#blue",
            env: "test",
            variant: "blue",
            region: "eu-central-1"
        });

        expect(result).toEqual({
            error: "Sync System: No version variable provided. Sync System will not be attached."
        });
    });
});
