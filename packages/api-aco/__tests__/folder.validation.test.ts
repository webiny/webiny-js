import { describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";

describe("`folder` input validation", () => {
    it("should not create a folder without the `type`", async () => {
        const { aco } = useGraphQlHandler({});

        const [response] = await aco.createFolder({
            data: {
                title: "Folder 1",
                slug: "folder-1"
            }
        });

        expect(response.errors).toBeUndefined();
        expect(response.data.aco.createFolder).toMatchObject({
            data: null,
            error: {
                code: "VALIDATION_FAILED_INVALID_FIELDS",
                message: "Validation failed.",
                data: {
                    invalidFields: {
                        type: expect.any(Object)
                    }
                }
            }
        });
    });

    it("should not create a folder with an empty `type`", async () => {
        const { aco } = useGraphQlHandler({});

        const [response] = await aco.createFolder({
            data: {
                title: "Folder 1",
                slug: "folder-1",
                type: ""
            }
        });

        expect(response.data.aco.createFolder).toMatchObject({
            data: null,
            error: {
                code: "VALIDATION_FAILED_INVALID_FIELDS"
            }
        });
    });
});
