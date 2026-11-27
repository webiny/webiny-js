import { beforeEach, describe, expect, it } from "vitest";
import { CmsGroup } from "~/types";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("content model create validation test", () => {
    const manager = useGraphQLHandler({ path: "manage" });

    let contentModelGroup: CmsGroup;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: undefined
        });
        contentModelGroup = result.group;
    });

    it("should return the invalid fields when the singular API name is not valid", async () => {
        const [response] = await manager.createContentModelMutation({
            data: {
                name: "Bad",
                modelId: "bad",
                singularApiName: "badSingular",
                pluralApiName: "BadPlurals",
                group: contentModelGroup.slug
            }
        });

        const error = response.data.createContentModel.error;

        expect(error.code).toBe("Cms/Model/ValidationError");
        expect(Object.keys(error.data.invalidFields)).toContain("singularApiName");
        expect(error.data.invalidFields.singularApiName.message).toContain(
            `The Singular API Name value "badSingular" is not valid`
        );
    });
});
