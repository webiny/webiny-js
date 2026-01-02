import { describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { createCmsFolderModelModifier } from "~/plugins";
import { folderMocks } from "~tests/mocks/folder.mock";

// TODO: enable this once extensions are sorted out!
describe.skip("Folder Model Extensions", () => {
    const { aco } = useGraphQlHandler({
        plugins: [
            createCmsFolderModelModifier(({ modifier }) => {
                modifier.addField({
                    id: "carMake",
                    fieldId: "carMake",
                    label: "Car Make",
                    type: "text"
                });

                modifier.addField({
                    id: "year",
                    fieldId: "year",
                    label: "Year of manufacturing",
                    type: "number"
                });

                modifier.addField({
                    id: "aDateTime",
                    fieldId: "aDateTime",
                    type: "datetime",
                    label: "A date time field",
                    renderer: {
                        name: "date-time-input"
                    },
                    settings: {
                        type: "dateTimeWithoutTimezone",
                        defaultSetValue: "current"
                    }
                });

                modifier.addField({
                    id: "article",
                    fieldId: "article",
                    label: "Article",
                    type: "ref",
                    renderer: {
                        name: "ref-advanced-single"
                    },
                    settings: {
                        models: [
                            {
                                modelId: "article"
                            }
                        ]
                    }
                });

                modifier.addField({
                    id: "field",
                    fieldId: "field",
                    label: "Field",
                    type: "text",
                    modelIds: ["article", "author"]
                });
            })
        ]
    });

    it("should add custom fields to `extensions` object field", async () => {
        const extensions = {
            cms_carMake: "Honda",
            cms_year: 2018,
            cms_aDateTime: "2020-01-01T00:00:00.000Z",
            cms_article: {
                modelId: "article",
                id: "abcdefg#0001"
            },
            cms_article_field: "article-field",
            cms_author_field: "author-field"
        };
        const fields = [
            "extensions { cms_carMake cms_year cms_aDateTime cms_article { id modelId } cms_article_field cms_author_field }"
        ];

        const createFolderA = await aco
            .createFolder(
                {
                    data: {
                        ...folderMocks.folderA,
                        extensions
                    }
                },
                fields
            )
            .then(([response]) => response.data.aco.createFolder.data);

        expect(createFolderA).toMatchObject({
            ...folderMocks.folderA,
            extensions
        });

        const getFolderA = await aco
            .getFolder({ id: createFolderA.id }, fields)
            .then(([response]) => response.data.aco.getFolder.data);

        expect(getFolderA).toMatchObject({
            ...folderMocks.folderA,
            extensions
        });
    });
});
