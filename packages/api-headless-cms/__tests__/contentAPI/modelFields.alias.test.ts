import { useContentGqlHandler } from "../utils/useContentGqlHandler";
import { CmsModelField } from "~/types";
import { generateAlphaLowerCaseId } from "@webiny/utils";

const nameOfTheFruitId = generateAlphaLowerCaseId();
const colorOfTheFruitId = generateAlphaLowerCaseId();
const descriptionOfTheFruitId = generateAlphaLowerCaseId();

const fields: CmsModelField[] = [
    {
        id: nameOfTheFruitId,
        label: "Name of the fruit",
        fieldId: `nameOfTheFruit@text@${nameOfTheFruitId}`,
        alias: "nameOfTheFruit",
        type: "text"
    },
    {
        id: colorOfTheFruitId,
        label: "Color of the fruit",
        fieldId: `colorOfTheFruit@text@${colorOfTheFruitId}`,
        alias: "colorOfTheFruit",
        type: "text"
    },
    {
        id: descriptionOfTheFruitId,
        label: "Description of the fruit",
        fieldId: `descriptionOfTheFruit@text@${descriptionOfTheFruitId}`,
        alias: "descriptionOfTheFruit",
        type: "text"
    }
];
const layout: string[][] = [[nameOfTheFruitId], [colorOfTheFruitId], [descriptionOfTheFruitId]];

describe("Model Fields Alias", () => {
    const manageOpts = {
        path: "manage/en-US"
    };
    const {
        createContentModelMutation,
        listContentModelsQuery,
        updateContentModelMutation,
        createContentModelGroupMutation
    } = useContentGqlHandler(manageOpts);

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        const contentModelGroup = createCMG.data.createContentModelGroup.data;
        await createContentModelMutation({
            data: {
                name: "Fruit",
                group: contentModelGroup.id
            }
        });
    });

    it("should update a model fields with fields which have aliases", async () => {
        const [updateResponse] = await updateContentModelMutation({
            modelId: "fruit",
            data: {
                fields,
                layout
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: {
                        modelId: "fruit",
                        fields,
                        layout
                    },
                    error: null
                }
            }
        });

        const [listResponse] = await listContentModelsQuery();

        expect(listResponse).toMatchObject({
            data: {
                listContentModels: {
                    data: [
                        {
                            modelId: "fruit",
                            fields,
                            layout
                        }
                    ],
                    error: null
                }
            }
        });
    });

    it("should throw error if any of the fields does not have an alias", async () => {
        const [updateResponse] = await updateContentModelMutation({
            modelId: "fruit",
            data: {
                fields: fields.map(field => {
                    const newField: Partial<CmsModelField> = {
                        ...field,
                        alias: ""
                    };
                    return newField;
                }),
                layout
            }
        });

        expect(updateResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "VALIDATION_FAILED_INVALID_FIELDS",
                        data: {
                            invalidFields: {
                                fields: {
                                    code: "VALIDATION_FAILED_INVALID_FIELD",
                                    data: [
                                        {
                                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                                            data: {
                                                index: 0,
                                                invalidFields: {
                                                    alias: {
                                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                                        data: null,
                                                        message: "Value is required."
                                                    }
                                                }
                                            },
                                            message: "Validation failed."
                                        },
                                        {
                                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                                            data: {
                                                index: 1,
                                                invalidFields: {
                                                    alias: {
                                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                                        data: null,
                                                        message: "Value is required."
                                                    }
                                                }
                                            },
                                            message: "Validation failed."
                                        },
                                        {
                                            code: "VALIDATION_FAILED_INVALID_FIELDS",
                                            data: {
                                                index: 2,
                                                invalidFields: {
                                                    alias: {
                                                        code: "VALIDATION_FAILED_INVALID_FIELD",
                                                        data: null,
                                                        message: "Value is required."
                                                    }
                                                }
                                            },
                                            message: "Validation failed."
                                        }
                                    ],
                                    message: "Validation failed."
                                }
                            }
                        },
                        message: "Validation failed."
                    }
                }
            }
        });
    });

    it("should throw an error if there are two identical aliases", async () => {
        const duplicateAliasFields = fields.concat([]);
        duplicateAliasFields[1].alias = duplicateAliasFields[0].alias;
        const [updateResponse] = await updateContentModelMutation({
            modelId: "fruit",
            data: {
                fields: duplicateAliasFields,
                layout
            }
        });
        expect(updateResponse).toMatchObject({
            data: {
                updateContentModel: {
                    data: null,
                    error: {
                        code: "DUPLICATE_FIELD_ALIAS_ERROR",
                        data: {
                            alias: duplicateAliasFields[1].alias
                        },
                        message: `Cannot update content model because field "${duplicateAliasFields[1].fieldId}" has alias "${duplicateAliasFields[0].alias}", which is already used.`
                    }
                }
            }
        });
    });
});
