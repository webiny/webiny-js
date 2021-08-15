import { CmsContentModelGroup, CmsModelFieldToGraphQLPlugin } from "../../src/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

const customFieldPlugin = (): CmsModelFieldToGraphQLPlugin => ({
    name: "cms-model-field-to-graphql-custom-test-field",
    type: "cms-model-field-to-graphql",
    fieldType: "custom-test-field",
    isSortable: false,
    isSearchable: false,
    read: {
        createTypeField({ field }) {
            return `${field.fieldId}: String`;
        },
        createGetFilters({ field }) {
            return `${field.fieldId}: String`;
        }
    },
    manage: {
        createTypeField({ field }) {
            return `${field.fieldId}: String`;
        },
        createInputField({ field }) {
            return `${field.fieldId}: String`;
        }
    }
});

describe("content model test no field plugin", () => {
    const readHandlerOpts = { path: "read/en-US" };
    const manageHandlerOpts = { path: "manage/en-US" };

    const { createContentModelGroupMutation } = useContentGqlHandler(manageHandlerOpts);

    let contentModelGroup: CmsContentModelGroup;

    beforeEach(async () => {
        const [createCMG] = await createContentModelGroupMutation({
            data: {
                name: "Group",
                slug: "group",
                icon: "ico/ico",
                description: "description"
            }
        });
        contentModelGroup = createCMG.data.createContentModelGroup.data;
    });

    test("prevent content model update if a backend plugin for a field does not exist", async () => {
        const { createContentModelMutation, updateContentModelMutation } =
            useContentGqlHandler(manageHandlerOpts);

        await createContentModelMutation({
            data: {
                name: "Test Content model",
                modelId: "testContentModel",
                group: contentModelGroup.id
            }
        }).then(async ([response]) => {
            expect(response).toMatchObject({
                data: {
                    createContentModel: {
                        data: {
                            modelId: "testContentModel",
                            name: "Test Content model",
                            titleFieldId: "id"
                        },
                        error: null
                    }
                }
            });

            await updateContentModelMutation({
                modelId: "testContentModel",
                data: {
                    layout: [["aaa", "bbb"]],
                    fields: [
                        {
                            type: "SOMETHING-INVALID-HERE",
                            validation: [],
                            renderer: {
                                name: "text-input"
                            },
                            label: "test",
                            fieldId: "test",
                            id: "aaa",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            }
                        },
                        {
                            type: "text",
                            validation: [],
                            renderer: {
                                name: "text-input"
                            },
                            label: "test",
                            fieldId: "test",
                            id: "bbb",
                            predefinedValues: {
                                enabled: false,
                                values: []
                            }
                        }
                    ]
                }
            }).then(([response]) => {
                expect(response).toEqual({
                    data: {
                        updateContentModel: {
                            data: null,
                            error: {
                                code: "",
                                data: null,
                                message:
                                    'Cannot update content model because of the unknown "SOMETHING-INVALID-HERE" field.'
                            }
                        }
                    }
                });
            });
        });
    });

    test("schema generation should not break if an old field type still exists", async () => {
        const customField = customFieldPlugin();
        const manageModelAPI = useContentGqlHandler(manageHandlerOpts, [customField]);
        const manageAPI = useContentGqlHandler(manageHandlerOpts);
        const readAPI = useContentGqlHandler(readHandlerOpts);
        const previewAPI = useContentGqlHandler(manageHandlerOpts);

        await manageModelAPI.createContentModelMutation({
            data: {
                name: "Event",
                modelId: "event",
                group: contentModelGroup.id
            }
        });

        await manageModelAPI.updateContentModelMutation({
            modelId: "event",
            data: {
                layout: [["1234"], ["2345"], ["9999"]],
                fields: [
                    {
                        id: "1234",
                        multipleValues: false,
                        helpText: "",
                        label: "Title",
                        type: "text",
                        fieldId: "title",
                        validation: [],
                        listValidation: [],
                        placeholderText: "placeholder text",
                        renderer: {
                            name: "renderer"
                        }
                    },
                    {
                        id: "2345",
                        multipleValues: false,
                        helpText: "",
                        label: "Slug",
                        type: "text",
                        fieldId: "slug",
                        validation: [],
                        listValidation: [],
                        placeholderText: "placeholder text",
                        renderer: {
                            name: "renderer"
                        }
                    },
                    {
                        id: "9999",
                        multipleValues: false,
                        helpText: "",
                        label: "Test",
                        type: "custom-test-field",
                        fieldId: "test",
                        validation: [],
                        listValidation: [],
                        renderer: {
                            name: "renderer"
                        }
                    }
                ]
            }
        });

        await manageAPI.createContentModelMutation({
            data: {
                name: "Bug",
                modelId: "bug",
                group: contentModelGroup.id
            }
        });

        const [manage] = await manageAPI.introspect();
        const [read] = await readAPI.introspect();
        const [preview] = await previewAPI.introspect();

        expect(Array.isArray(manage.data.__schema.types)).toBe(true);

        expect(Array.isArray(read.data.__schema.types)).toBe(true);

        expect(Array.isArray(preview.data.__schema.types)).toBe(true);
    });
});
