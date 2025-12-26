import { describe, it, expect } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { folderMocks } from "~tests/mocks/folder.mock";
import { createFmFileFolderModelModifier } from "~/plugins";

// TODO: enable this once the new extensions API is finalized
describe.skip("Folder Model Extensions", () => {
    const { aco } = useGraphQlHandler({
        plugins: [
            createFmFileFolderModelModifier(({ modifier }) => {
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
            })
        ]
    });

    it("should add custom fields to `extensions` object field", async () => {
        const extensions = {
            fm_file_carMake: "Honda",
            fm_file_year: 2018,
            fm_file_aDateTime: "2020-01-01T00:00:00.000Z",
            fm_file_article: {
                modelId: "article",
                id: "abcdefg#0001"
            }
        };
        const fields = [
            "extensions { fm_file_carMake fm_file_year fm_file_aDateTime fm_file_article { id modelId } }"
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
            .then(([response]) => {
                return response.data.aco.createFolder.data;
            });

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
