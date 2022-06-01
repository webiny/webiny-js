import { setupDefaultWorkflow } from "./helpers";
import { ApwWorkflowApplications } from "~/types";
import { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types";

const createGroupData = () => {
    return {
        name: "Group",
        slug: "group",
        icon: "ico/ico",
        description: "description"
    };
};

const createModelData = (
    group: CmsGroup
): Pick<CmsModel, "name" | "modelId" | "fields" | "layout" | "titleFieldId"> & {
    group: string;
} => {
    return {
        name: "Product",
        group: group.id,
        modelId: "product",
        fields: [
            {
                id: "name",
                fieldId: "name",
                label: "Name",
                type: "text",
                settings: {}
            },
            {
                id: "sku",
                fieldId: "sku",
                label: "SKU",
                type: "number",
                settings: {}
            },
            {
                id: "description",
                fieldId: "description",
                label: "Description",
                type: "long-text",
                settings: {}
            }
        ],
        layout: [["name"], ["sku"], ["description"]],
        titleFieldId: "name"
    };
};

const createEntryData = () => {
    return {
        name: "Webiny product",
        sku: 1234567890,
        description: `
                This is a description of a Webiny product.
                We are doing this to test the Advanced Publishing Workflow on the CMS Entries.
            `
    };
};

const setupContentModelGroup = async (handler: any) => {
    const [response] = await handler.createContentModelGroupMutation({
        data: {
            ...createGroupData()
        }
    });
    expect(response).toMatchObject({
        data: {
            createContentModelGroup: {
                data: {
                    ...createGroupData()
                },
                error: null
            }
        }
    });
    return response.data.createContentModelGroup.data;
};

const setupContentModel = async (handler: any, group: CmsGroup) => {
    const [response] = await handler.createContentModelMutation({
        data: {
            ...createModelData(group)
        }
    });

    expect(response).toMatchObject({
        data: {
            createContentModel: {
                data: {
                    ...createModelData(group),
                    group: {
                        id: group.id,
                        name: group.name
                    }
                },
                error: null
            }
        }
    });

    return response.data.createContentModel.data;
};

const setupContentEntry = async (handler: any, model: CmsModel) => {
    const [response] = await handler.createContentEntryMutation(model, {
        data: createEntryData()
    });

    expect(response).toEqual({
        data: {
            createProduct: {
                data: {
                    ...createEntryData(),
                    id: expect.any(String),
                    entryId: expect.any(String),
                    meta: {
                        data: {
                            apw: {
                                workflowId: expect.any(String),
                                contentReviewId: null
                            }
                        },
                        status: "draft",
                        version: 1
                    }
                },
                error: null
            }
        }
    });
    return response.data.createProduct.data;
};

const setupEntry = async (handler: any) => {
    const group = await setupContentModelGroup(handler);

    const model = await setupContentModel(handler, group);

    const entry = await setupContentEntry(handler, model);

    return {
        group,
        model,
        entry: {
            id: entry.id,
            entryId: entry.entryId,
            name: entry.name,
            sku: entry.sku,
            description: entry.description,
            meta: entry.meta
        }
    };
};

export const createSetupForEntryContentReview = async (handler: any) => {
    const workflow = await setupDefaultWorkflow(handler, {
        app: ApwWorkflowApplications.CMS
    });

    await handler.until(
        () => handler.listWorkflowsQuery({}).then(([data]: any) => data),
        (response: any) => {
            const list = response.data.apw.listWorkflows.data;
            return list.length === 1;
        },
        {
            name: "Wait for workflow entry to be available in list query before creating page."
        }
    );

    const { entry, model, group } = await setupEntry(handler);

    return {
        entry,
        model,
        group,
        workflow,
        createPage: setupEntry
    };
};
