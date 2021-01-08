const setup = require("../setup");

describe("Setup Test", () => {
    test("should throw error on invalid arguments", async () => {
        let error;

        try {
            await setup();
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidFields: {
                projectName: {
                    code: "VALIDATION_FAILED_INVALID_FIELD",
                    data: null,
                    message: "Value is required."
                },
                projectRoot: {
                    code: "VALIDATION_FAILED_INVALID_FIELD",
                    data: null,
                    message: "Value is required."
                }
            }
        });
    });
});
