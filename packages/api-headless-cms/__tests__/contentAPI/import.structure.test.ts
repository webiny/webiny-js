import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { createCmsGroup } from "~/plugins";
import { exportedGroupsAndModels } from "~tests/contentAPI/mocks/exportedGroupsAndModels";
import { CmsImportAction } from "~/export/types";
import { CmsModel } from "~/types";

describe("import cms structure", () => {
    const {
        validateCmsStructureMutation,
        importCmsStructureMutation,
        listContentModelsQuery,
        listContentModelGroupsQuery
    } = useGraphQLHandler({
        path: "manage/en-US"
    });

    it("should return error as there are no groups to validate", async () => {
        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [],
                models: []
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [],
                        models: [],
                        message: "No groups to import."
                    },
                    error: null
                }
            }
        });
    });

    it("should return error as there are no models to validate", async () => {
        const group = {
            id: "group-1",
            name: "Group 1",
            slug: "group-1",
            icon: "fas/star",
            description: "Group 1 description"
        };

        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [group],
                models: []
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                group: {
                                    id: group.id,
                                    name: group.name
                                },
                                action: CmsImportAction.CREATE,
                                error: null
                            }
                        ],
                        models: [],
                        message: "No models to import."
                    },
                    error: null
                }
            }
        });
    });

    it("should show errors when trying to validate faulty groups", async () => {
        const group1 = {
            id: "group-1",
            slug: "",
            name: "Group 1",
            icon: "fa/fas"
        };
        const group2 = {
            id: "",
            slug: "group-2",
            name: "Group 2",
            icon: "fa/fas"
        };

        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [group1, group2],
                models: []
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                action: null,
                                group: {
                                    id: group1.id,
                                    name: group1.name
                                },
                                error: {
                                    code: "GROUP_SLUG_MISSING",
                                    data: null,
                                    message: "Group is missing slug."
                                }
                            },
                            {
                                action: null,
                                group: {
                                    id: "",
                                    name: group2.name
                                },
                                error: {
                                    code: "GROUP_ID_MISSING",
                                    data: null,
                                    message: "Group is missing ID."
                                }
                            }
                        ],
                        models: [],
                        message: "No models to import."
                    },
                    error: null
                }
            }
        });
    });

    it("should show errors when trying to validate groups which already exist in the system", async () => {
        const { validateCmsStructureMutation } = useGraphQLHandler({
            path: "manage/en-US",
            plugins: [
                createCmsGroup({
                    id: "group-1-original",
                    slug: "group-1",
                    name: "Group 1 Original",
                    icon: "fa/fas",
                    description: ""
                }),
                createCmsGroup({
                    id: "group-2",
                    slug: "group-2-original",
                    name: "Group 2 Original",
                    icon: "fa/fas",
                    description: ""
                })
            ]
        });

        const group1 = {
            id: "group-1",
            slug: "group-1",
            name: "Group 1",
            icon: "fa/fas"
        };
        const group2 = {
            id: "group-2",
            slug: "group-2",
            name: "Group 2",
            icon: "fa/fas"
        };
        const group3 = {
            id: "group-3",
            slug: "group-3",
            name: "Group 3",
            icon: "fa/fas"
        };

        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [group1, group2, group3],
                models: []
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                action: "code",
                                group: {
                                    id: group1.id,
                                    name: group1.name
                                },
                                error: {
                                    code: "GROUP_IS_PLUGIN",
                                    data: null,
                                    message: `Group already exists, but it is a plugin group - cannot be updated.`
                                }
                            },
                            {
                                action: "code",
                                group: {
                                    id: group2.id,
                                    name: group2.name
                                },
                                error: {
                                    code: "GROUP_IS_PLUGIN",
                                    data: null,
                                    message: `Group already exists, but it is a plugin group - cannot be updated.`
                                }
                            },
                            {
                                action: CmsImportAction.CREATE,
                                group: {
                                    id: group3.id,
                                    name: group3.name
                                },
                                error: null
                            }
                        ],
                        models: [],
                        message: "No models to import."
                    },
                    error: null
                }
            }
        });
    });

    it("should show no errors when trying to validate valid groups", async () => {
        const group1 = {
            id: "group-1",
            slug: "group-1",
            name: "Group 1",
            icon: "fa/fas"
        };
        const group2 = {
            id: "group-2",
            slug: "group-2",
            name: "Group 2",
            icon: "fa/fas"
        };

        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [group1, group2],
                models: []
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                action: CmsImportAction.CREATE,
                                group: {
                                    id: group1.id,
                                    name: group1.name
                                },
                                error: null
                            },
                            {
                                action: CmsImportAction.CREATE,
                                group: {
                                    id: group2.id,
                                    name: group2.name
                                },
                                error: null
                            }
                        ],
                        models: [],
                        message: "No models to import."
                    },
                    error: null
                }
            }
        });
    });

    it("should show errors when trying to validate empty model values", async () => {
        const group = {
            id: "group-1",
            slug: "group-1",
            name: "Group 1",
            icon: "fa/fas"
        };

        const model = {
            modelId: "",
            name: "",
            group: "",
            fields: [],
            layout: [],
            singularApiName: "",
            pluralApiName: "",
            titleFieldId: ""
        };
        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [group],
                models: [model]
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                action: CmsImportAction.CREATE,
                                group: {
                                    id: group.id,
                                    name: group.name
                                },
                                error: null
                            }
                        ],
                        models: [
                            {
                                action: null,
                                model: {
                                    modelId: "",
                                    name: ""
                                },
                                related: null,
                                error: {
                                    code: "VALIDATION_FAILED_INVALID_FIELDS",
                                    data: {
                                        invalidFields: {
                                            modelId: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            name: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            singularApiName: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            pluralApiName: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            fields: {
                                                code: "too_small",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            layout: {
                                                code: "too_small",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            }
                                        }
                                    },
                                    message: "Validation failed."
                                }
                            }
                        ],
                        message: "Validation done."
                    },
                    error: null
                }
            }
        });
    });

    it("should show errors when trying to validate invalid model values", async () => {
        const group = {
            id: "group-1",
            slug: "group-1",
            name: "Group 1",
            icon: "fa/fas"
        };

        const model = {
            modelId: "1",
            name: "2",
            group: "3",
            fields: [],
            layout: [],
            singularApiName: "4",
            pluralApiName: "5",
            titleFieldId: "6"
        };
        const [result] = await validateCmsStructureMutation({
            data: {
                groups: [group],
                models: [model]
            }
        });
        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                action: CmsImportAction.CREATE,
                                group: {
                                    id: group.id,
                                    name: group.name
                                },
                                error: null
                            }
                        ],
                        models: [
                            {
                                action: null,
                                model: {
                                    modelId: "1",
                                    name: "2"
                                },
                                related: null,
                                error: {
                                    code: "VALIDATION_FAILED_INVALID_FIELDS",
                                    data: {
                                        invalidFields: {
                                            modelId: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            name: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            singularApiName: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            pluralApiName: {
                                                code: "custom",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            fields: {
                                                code: "too_small",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            },
                                            layout: {
                                                code: "too_small",
                                                data: expect.any(Object),
                                                message: expect.any(String)
                                            }
                                        }
                                    },
                                    message: "Validation failed."
                                }
                            }
                        ],
                        message: "Validation done."
                    },
                    error: null
                }
            }
        });
    });

    it("should show no errors when groups and models are valid - exported data", async () => {
        const [result] = await validateCmsStructureMutation({
            data: exportedGroupsAndModels
        });

        const articleModel = exportedGroupsAndModels.models.find(
            model => model.modelId === "article"
        ) as unknown as CmsModel;
        const authorModel = exportedGroupsAndModels.models.find(
            model => model.modelId === "author"
        ) as unknown as CmsModel;
        const categoryModel = exportedGroupsAndModels.models.find(
            model => model.modelId === "category"
        ) as unknown as CmsModel;

        expect(result).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: exportedGroupsAndModels.groups.map(group => {
                            return {
                                action: CmsImportAction.CREATE,
                                group: {
                                    id: group.id,
                                    name: group.name
                                },
                                error: null
                            };
                        }),
                        models: [
                            {
                                action: CmsImportAction.CREATE,
                                model: {
                                    modelId: articleModel.modelId,
                                    name: articleModel.name
                                },
                                related: ["author", "category"],
                                error: null
                            },
                            {
                                action: CmsImportAction.CREATE,
                                model: {
                                    modelId: authorModel.modelId,
                                    name: authorModel.name
                                },
                                related: [],
                                error: null
                            },
                            {
                                action: CmsImportAction.CREATE,
                                model: {
                                    modelId: categoryModel.modelId,
                                    name: categoryModel.name
                                },
                                related: [],
                                error: null
                            }
                        ],
                        message: "Validation done."
                    },
                    error: null
                }
            }
        });
    });

    it("should import valid groups and models - exported data", async () => {
        const [result] = await importCmsStructureMutation({
            data: exportedGroupsAndModels,
            models: exportedGroupsAndModels.models.map(model => model.modelId)
        });

        expect(result).toEqual({
            data: {
                importStructure: {
                    data: {
                        groups: exportedGroupsAndModels.groups.map(group => {
                            return {
                                action: null,
                                group: {
                                    id: group.id,
                                    name: group.name
                                },
                                error: null
                            };
                        }),
                        models: exportedGroupsAndModels.models.map(model => {
                            return {
                                action: null,
                                related: null,
                                model: {
                                    modelId: model.modelId,
                                    name: model.name
                                },
                                error: null
                            };
                        }),
                        message: "Import done."
                    },
                    error: null
                }
            }
        });

        const expectedGroups = exportedGroupsAndModels.groups.map(group => {
            return {
                id: group.id,
                slug: group.slug
            };
        });
        const [listGroupsResponse] = await listContentModelGroupsQuery();
        expect(listGroupsResponse).toMatchObject({
            data: {
                listContentModelGroups: {
                    data: expectedGroups,
                    error: null
                }
            }
        });
        const listedGroups = listGroupsResponse.data.listContentModelGroups.data;
        expect(listedGroups).toHaveLength(expectedGroups.length);
        expect(listedGroups).toMatchObject(expectedGroups);

        const expectedModels = exportedGroupsAndModels.models.map(model => {
            return {
                modelId: model.modelId,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName
            };
        });

        const [listModelsResponse] = await listContentModelsQuery();
        expect(listModelsResponse).toMatchObject({
            data: {
                listContentModels: {
                    data: expectedModels,
                    error: null
                }
            }
        });
        const listedModels = listModelsResponse.data.listContentModels.data;
        expect(listedModels).toHaveLength(expectedModels.length);
        expect(listedModels).toMatchObject(expectedModels);
    });

    it("should show warnings when trying to import groups and models which already exist in the system", async () => {
        const [importResult] = await importCmsStructureMutation({
            data: exportedGroupsAndModels,
            models: exportedGroupsAndModels.models.map(model => model.modelId)
        });
        expect(importResult).toMatchObject({
            data: {
                importStructure: {
                    data: {
                        message: "Import done."
                    },
                    error: null
                }
            }
        });

        const [validateResult] = await validateCmsStructureMutation({
            data: exportedGroupsAndModels
        });
        expect(validateResult).toEqual({
            data: {
                validateImportStructure: {
                    data: {
                        groups: [
                            {
                                group: {
                                    id: "64d4c105110b570008736515",
                                    name: "Blog"
                                },
                                action: CmsImportAction.UPDATE,
                                error: null
                            }
                        ],
                        models: [
                            {
                                action: CmsImportAction.UPDATE,
                                error: null,
                                related: ["author", "category"],
                                model: {
                                    modelId: "article",
                                    name: "Article"
                                }
                            },
                            {
                                action: CmsImportAction.UPDATE,
                                error: null,
                                related: [],
                                model: {
                                    modelId: "author",
                                    name: "Author"
                                }
                            },
                            {
                                action: CmsImportAction.UPDATE,
                                error: null,
                                related: [],
                                model: {
                                    modelId: "category",
                                    name: "Category"
                                }
                            }
                        ],
                        message: "Validation done."
                    },
                    error: null
                }
            }
        });
    });
});
