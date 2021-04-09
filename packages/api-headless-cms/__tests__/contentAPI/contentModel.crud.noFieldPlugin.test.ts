import { CmsContentModelGroup } from "../../src/types";
import { useContentGqlHandler } from "../utils/useContentGqlHandler";

describe("content model test", () => {
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
        const { createContentModelMutation, updateContentModelMutation } = useContentGqlHandler(
            manageHandlerOpts
        );

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
        const manageAPI = useContentGqlHandler(manageHandlerOpts);
        const readAPI = useContentGqlHandler(readHandlerOpts);
        const previewAPI = useContentGqlHandler(manageHandlerOpts);

        // We insert data with DocumentClient because API won't let us do it (will throw an error immediately).
        await manageAPI.documentClient
            .put({
                TableName: "HeadlessCms",
                Item: {
                    PK: "T#root#L#en-US#CMS#CM",
                    SK: "event",
                    modelId: "event",
                    savedOn: "2021-03-05T06:23:15.152Z",
                    layout: [["u3860Lhy-"]],
                    group: {
                        name: "Ungrouped",
                        id: "603d11a279571c0008e8a208"
                    },
                    lockedFields: [],
                    name: "Event",
                    TYPE: "cms.model",
                    titleFieldId: "test",
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
            })
            .promise();

        const [manage] = await manageAPI.introspect();
        expect(Array.isArray(manage.data.__schema.types)).toBe(true);

        const [read] = await readAPI.introspect();
        expect(Array.isArray(read.data.__schema.types)).toBe(true);

        const [preview] = await previewAPI.introspect();
        expect(Array.isArray(preview.data.__schema.types)).toBe(true);
    });
});
