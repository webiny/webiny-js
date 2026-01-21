import { describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler";
import { createFolderModelModifier } from "~/folder/createFolderModelModifier";
import { folderMocks } from "~tests/mocks/folder.mock";

// TODO: revisit this once we revive extensions on CMS models
describe.skip("Folder Model Extensions", () => {
    const { aco } = useGraphQlHandler({
        plugins: [
            createFolderModelModifier(({ modifier }) => {
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
            carMake: "Honda",
            year: 2018,
            aDateTime: "2020-01-01T00:00:00.000Z",
            article: {
                modelId: "article",
                id: "abcdefg#0001"
            }
        };
        const fields = ["extensions { carMake year aDateTime article { id modelId } }"];

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
