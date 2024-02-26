import useGqlHandler from "~tests/utils/useGqlHandler";
import { createFileModelModifier } from "~/modelModifier/CmsModelModifier";
import { fileAData } from "./mocks/files";

describe("File Model Extensions", () => {
    const { listFiles, createFile } = useGqlHandler({
        plugins: [
            // Add custom fields that will be assigned to the `extensions` object field.
            createFileModelModifier(({ modifier }) => {
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

        const [createAResponse] = await createFile(
            {
                data: {
                    ...fileAData,
                    extensions
                }
            },
            fields
        );
        expect(createAResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileAData,
                            extensions
                        },
                        error: null
                    }
                }
            }
        });

        const [listResponse] = await listFiles({}, fields);

        expect(listResponse).toEqual({
            data: {
                fileManager: {
                    listFiles: {
                        data: [
                            {
                                ...fileAData,
                                extensions
                            }
                        ],
                        meta: {
                            totalCount: 1,
                            hasMoreItems: false,
                            cursor: null
                        },
                        error: null
                    }
                }
            }
        });
    });
});
