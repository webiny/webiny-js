import InvalidAttributesError from "webiny-api/graphql/fields/crud/InvalidAttributesError";
import { ModelError } from "webiny-model";

describe("FormattedInvalidAttributesError test", function() {
    it("must format error correctly, using keys as paths of invalid attributes", async () => {
        const mock = {
            invalidAttributes: {
                name: {
                    message: "Invalid attribute.",
                    code: "INVALID_ATTRIBUTE",
                    data: { message: "Value is required." }
                },
                slug: {
                    message: "Invalid attribute.",
                    code: "INVALID_ATTRIBUTE",
                    data: { message: "Value is required." }
                },
                description: {
                    message: "Invalid attribute.",
                    code: "INVALID_ATTRIBUTE",
                    data: { message: "Value is required." }
                }
            }
        };

        const err = InvalidAttributesError.from(new ModelError("Error", "CODE", mock));

        expect(err.data.invalidAttributes).toEqual({
            name: "Value is required.",
            slug: "Value is required.",
            description: "Value is required."
        });
    });

    it("must format error correctly, including arrays set as data", async () => {
        const mock = {
            invalidAttributes: {
                company: {
                    message: "Testing this...",
                    code: "INVALID_ATTRIBUTE",
                    data: { message: "Testing this message..." }
                },
                attribute1: {
                    code: "INVALID_ATTRIBUTE",
                    data: [
                        {
                            code: "INVALID_ATTRIBUTES",
                            data: {
                                index: 0,
                                invalidAttributes: {
                                    name: {
                                        code: "INVALID_ATTRIBUTE",
                                        data: {
                                            message: "Value is required.",
                                            value: null,
                                            validator: "required"
                                        },
                                        message: "Invalid attribute."
                                    }
                                }
                            },
                            message: "Validation failed."
                        },
                        {
                            code: "INVALID_ATTRIBUTE",
                            data: {
                                index: 1
                            },
                            message:
                                "Validation failed, item at index 1 not an instance of correct Entity class."
                        }
                    ],
                    message: "Validation failed."
                }
            }
        };

        const err = InvalidAttributesError.from(new ModelError("Error", "CODE", mock));

        expect(err.data.invalidAttributes).toEqual({
            company: "Testing this message...",
            "attribute1.0.name": "Value is required.",
            "attribute1.1":
                "Validation failed, item at index 1 not an instance of correct Entity class."
        });
    });
});
