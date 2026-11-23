import type { ApiSession } from "./apiSession.ts";
import type { GraphqlResult } from "./callGraphql.ts";
import { callGraphql, requireData } from "./callGraphql.ts";

/** A Headless CMS model with one text field, `title`, in a group of its own. */
export interface TestModel {
    groupId: string;
    modelId: string;
    name: string;
    singularApiName: string;
}

interface CmsError {
    code: string | null;
    message: string | null;
    data: unknown;
}

interface CreateGroupData {
    createContentModelGroup: {
        data: { id: string; slug: string } | null;
        error: CmsError | null;
    };
}

interface CreateModelData {
    createContentModel: {
        data: { modelId: string } | null;
        error: CmsError | null;
    };
}

interface DeleteData {
    deleteContent: {
        data: boolean | null;
        error: CmsError | null;
    };
}

const CREATE_GROUP = /* GraphQL */ `
    mutation CreateGroup($data: CmsContentModelGroupInput!) {
        createContentModelGroup(data: $data) {
            data {
                id
                slug
            }
            error {
                code
                message
            }
        }
    }
`;

const CREATE_MODEL = /* GraphQL */ `
    mutation CreateModel($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
            data {
                modelId
            }
            error {
                code
                message
                data
            }
        }
    }
`;

// Aliased to one name so both deletes read the same way.
const DELETE_MODEL = /* GraphQL */ `
    mutation DeleteModel($modelId: ID!) {
        deleteContent: deleteContentModel(modelId: $modelId) {
            data
            error {
                code
                message
            }
        }
    }
`;

const DELETE_GROUP = /* GraphQL */ `
    mutation DeleteGroup($id: ID!) {
        deleteContent: deleteContentModelGroup(id: $id) {
            data
            error {
                code
                message
            }
        }
    }
`;

/**
 * Creates a group and a model in it, both named after `runId` so runs and shards never share them.
 * The model's one field, `title`, is its title field.
 */
export const createTestModel = async (session: ApiSession, runId: string): Promise<TestModel> => {
    const groupResult = await callGraphql<CreateGroupData>(session, "cms/manage", CREATE_GROUP, {
        data: {
            name: `E2E workflows ${runId}`,
            slug: `e2e-workflows-${runId}`,
            description: "Created by the workflows e2e tests.",
            icon: { type: "icon", name: "fas/star" }
        }
    });
    const group = requireData(groupResult, "createContentModelGroup").createContentModelGroup;
    if (!group.data) {
        throw new Error(`createContentModelGroup failed: ${group.error?.message}`);
    }

    const name = `E2E Review ${runId}`;
    // API names must stay unchanged by camel-casing, so the digits go last and no letter follows them.
    const singularApiName = `WfReview${runId}`;
    const modelResult = await callGraphql<CreateModelData>(session, "cms/manage", CREATE_MODEL, {
        data: {
            name,
            modelId: `wfReview${runId}`,
            singularApiName,
            pluralApiName: `WfReviews${runId}`,
            // A model names its group by slug; workflows look the group up by it.
            group: group.data.slug,
            description: "Created by the workflows e2e tests.",
            fields: [
                {
                    id: "title",
                    fieldId: "title",
                    label: "Title",
                    type: "text",
                    renderer: { name: "text-input" }
                }
            ],
            layout: [["title"]],
            titleFieldId: "title"
        }
    });
    const model = requireData(modelResult, "createContentModel").createContentModel;
    if (!model.data) {
        const details = JSON.stringify(model.error?.data ?? null);
        throw new Error(`createContentModel failed: ${model.error?.message} ${details}`);
    }

    return { groupId: group.data.id, modelId: model.data.modelId, name, singularApiName };
};

const toErrorMessage = (result: GraphqlResult<DeleteData>): string | null => {
    return result.errors?.[0]?.message ?? result.data?.deleteContent.error?.message ?? null;
};

/**
 * Deletes the model, then its group. Delete the model's entries and its workflow first. Returns the
 * first error message, or null when both are gone.
 */
export const deleteTestModel = async (
    session: ApiSession,
    model: TestModel
): Promise<string | null> => {
    const modelResult = await callGraphql<DeleteData>(session, "cms/manage", DELETE_MODEL, {
        modelId: model.modelId
    });
    const modelError = toErrorMessage(modelResult);
    if (modelError) {
        return modelError;
    }

    const groupResult = await callGraphql<DeleteData>(session, "cms/manage", DELETE_GROUP, {
        id: model.groupId
    });
    return toErrorMessage(groupResult);
};
