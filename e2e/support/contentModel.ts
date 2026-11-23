import type { ApiSession } from "./apiSession.ts";
import type { GraphqlResult } from "./callGraphql.ts";
import { callGraphql, requireData } from "./callGraphql.ts";

/**
 * A Headless CMS model in a group of its own, with a text field `title`, its title field, and, when
 * asked for, a number field `price`.
 */
export interface TestModel {
    groupId: string;
    modelId: string;
    name: string;
    singularApiName: string;
    pluralApiName: string;
}

/** Who the model is for, and what goes into its names. */
export interface TestModelOptions {
    /** The area that creates it, in the group's name, slug and description: `workflows`. */
    area: string;
    /** The model's name, before the run id: `E2E Review`. */
    label: string;
    /** The singular API name, before the run id, letters only: `WfReview`. The plural adds `s`. */
    apiName: string;
    /** Adds a number field, `price`, after the title. */
    withPrice?: boolean;
}

const WORKFLOWS_MODEL: TestModelOptions = {
    area: "workflows",
    label: "E2E Review",
    apiName: "WfReview"
};

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

const TITLE_FIELD = {
    id: "title",
    fieldId: "title",
    label: "Title",
    type: "text",
    renderer: { name: "text-input" }
};

const PRICE_FIELD = {
    id: "price",
    fieldId: "price",
    label: "Price",
    type: "number",
    renderer: { name: "number-input" }
};

/**
 * Creates a group and a model in it, both named after `runId` so runs and shards never share them.
 * The model's `title` field is its title field. Without `options` it is the workflows tests' model.
 */
export const createTestModel = async (
    session: ApiSession,
    runId: string,
    options: TestModelOptions = WORKFLOWS_MODEL
): Promise<TestModel> => {
    const description = `Created by the ${options.area} e2e tests.`;
    const groupResult = await callGraphql<CreateGroupData>(session, "cms/manage", CREATE_GROUP, {
        data: {
            name: `E2E ${options.area} ${runId}`,
            slug: `e2e-${options.area}-${runId}`,
            description,
            icon: { type: "icon", name: "fas/star" }
        }
    });
    const group = requireData(groupResult, "createContentModelGroup").createContentModelGroup;
    if (!group.data) {
        throw new Error(`createContentModelGroup failed: ${group.error?.message}`);
    }

    const name = `${options.label} ${runId}`;
    // API names must stay unchanged by camel-casing, so the digits go last and no letter follows them.
    const singularApiName = `${options.apiName}${runId}`;
    const pluralApiName = `${options.apiName}s${runId}`;
    const modelId = `${options.apiName.charAt(0).toLowerCase()}${options.apiName.slice(1)}${runId}`;
    const fields = options.withPrice ? [TITLE_FIELD, PRICE_FIELD] : [TITLE_FIELD];
    const modelResult = await callGraphql<CreateModelData>(session, "cms/manage", CREATE_MODEL, {
        data: {
            name,
            modelId,
            singularApiName,
            pluralApiName,
            // A model names its group by slug; workflows look the group up by it.
            group: group.data.slug,
            description,
            fields,
            layout: fields.map(field => [field.id]),
            titleFieldId: "title"
        }
    });
    const model = requireData(modelResult, "createContentModel").createContentModel;
    if (!model.data) {
        const details = JSON.stringify(model.error?.data ?? null);
        throw new Error(`createContentModel failed: ${model.error?.message} ${details}`);
    }

    return {
        groupId: group.data.id,
        modelId: model.data.modelId,
        name,
        singularApiName,
        pluralApiName
    };
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
