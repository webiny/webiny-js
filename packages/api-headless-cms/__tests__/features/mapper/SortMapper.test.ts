import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { CmsSortMapper } from "~/features/sortMapper/abstractions.js";
import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";
import type { CmsModel } from "~/types/index.js";
import type { CmsEntryListSort } from "~/types/types.js";

describe("Sort mapper for custom GraphQL sort input", async () => {
    const manager = useCategoryManageHandler({
        path: "manage"
    });
    const handler = useHandler({
        path: "manage",
        plugins: []
    });

    let model: CmsModel;

    beforeEach(async () => {
        const result = await setupGroupAndModels({
            manager,
            models: ["category"]
        });
        model = Object.freeze(result.getModel("category"));
    });

    const resolveMapper = async () => {
        const context = await handler.handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": "root"
            }
        });

        return context.container.resolve(CmsSortMapper);
    };

    it("should have mapper resolved", async () => {
        const mapper = await resolveMapper();
        expect(mapper).not.toBeUndefined();
    });

    it("should return undefined for undefined input", async () => {
        const mapper = await resolveMapper();

        const result = mapper.map({
            input: undefined,
            fields: model.fields
        });

        expect(result).toBeUndefined();
    });

    it("should return empty array for empty input", async () => {
        const mapper = await resolveMapper();

        const result = mapper.map({
            input: [],
            fields: model.fields
        });

        expect(result).toEqual([]);
    });

    it("should not map system fields", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = [
            "id_ASC",
            "id_DESC",
            "createdBy_ASC",
            "createdBy_DESC",
            "savedOn_ASC",
            "savedOn_DESC"
        ];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual([
            "id_ASC",
            "id_DESC",
            "createdBy_ASC",
            "createdBy_DESC",
            "savedOn_ASC",
            "savedOn_DESC"
        ]);
    });

    it("should map model fields to values prefix", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = ["title_ASC", "title_DESC"];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual(["values_title_ASC", "values_title_DESC"]);
    });

    it("should not double-map fields already prefixed with values", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = ["values_title_ASC", "values_title_DESC"];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual(["values_title_ASC", "values_title_DESC"]);
    });

    it("should handle mixed system and model fields", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = ["title_ASC", "createdBy_DESC", "savedOn_ASC"];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual(["values_title_ASC", "createdBy_DESC", "savedOn_ASC"]);
    });

    it("should strip invalid sort strings", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = [
            // @ts-expect-error
            "invalidSort",
            // @ts-expect-error
            "no_direction",
            "_INVALID_ASC",
            // @ts-expect-error
            "title_INVALID"
        ];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    it("should handle fields that don't exist in the model", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = ["nonExistentField_ASC", "anotherField_DESC"];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        // Fields that don't exist in the model should not be prefixed with values_
        expect(result).toEqual(["nonExistentField_ASC", "anotherField_DESC"]);
    });

    it("should handle multiple model fields", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = ["title_ASC", "slug_DESC"];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual(["values_title_ASC", "values_slug_DESC"]);
    });

    it("should handle complex sorting with system and model fields", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = [
            "title_ASC",
            "createdOn_DESC",
            "id_ASC",
            "slug_DESC",
            "savedOn_ASC"
        ];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        expect(result).toEqual([
            "values_title_ASC",
            "createdOn_DESC",
            "id_ASC",
            "values_slug_DESC",
            "savedOn_ASC"
        ]);
    });

    it("should handle case-sensitive field names", async () => {
        const mapper = await resolveMapper();

        const input: CmsEntryListSort = [
            "Title_ASC", // Wrong case
            "title_DESC" // Correct case
        ];

        const result = mapper.map({
            input,
            fields: model.fields
        });

        // Only exact field names should be mapped
        expect(result).toEqual([
            "Title_ASC", // Not mapped because it doesn't match
            "values_title_DESC" // Mapped correctly
        ]);
    });

    it("should handle alphanumeric field names", async () => {
        const mapper = await resolveMapper();

        const fieldsWithAlphanumeric = [...model.fields, { fieldId: "field123" } as any];

        const input: CmsEntryListSort = ["field123_ASC", "field456_DESC"];

        const result = mapper.map({
            input: input,
            fields: fieldsWithAlphanumeric
        });

        expect(result).toEqual(["values_field123_ASC", "field456_DESC"]);
    });
});
