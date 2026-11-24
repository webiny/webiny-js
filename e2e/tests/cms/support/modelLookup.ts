import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";

/** A field of a model, as the API stores it. */
export interface StoredField {
    fieldId: string;
    type: string;
    validation: { name: string }[] | null;
}

/** A model as the API stores it. */
export interface StoredModel {
    modelId: string;
    name: string;
    titleFieldId: string | null;
    /** The group's slug. */
    group: string;
    fields: StoredField[];
}

/** A model group as the API stores it. */
export interface StoredGroup {
    id: string;
    name: string;
    slug: string;
}

interface CmsError {
    code: string | null;
    message: string | null;
}

interface ListModelsData {
    listContentModels: {
        data: StoredModel[] | null;
        error: CmsError | null;
    };
}

interface ListGroupsData {
    listContentModelGroups: {
        data: StoredGroup[] | null;
        error: CmsError | null;
    };
}

interface DeleteData {
    deleteContent: {
        error: CmsError | null;
    };
}

const LIST_MODELS = /* GraphQL */ `
    query ListModels {
        listContentModels {
            data {
                modelId
                name
                titleFieldId
                group
                fields {
                    fieldId
                    type
                    validation {
                        name
                    }
                }
            }
            error {
                code
                message
            }
        }
    }
`;

const LIST_GROUPS = /* GraphQL */ `
    query ListGroups {
        listContentModelGroups {
            data {
                id
                name
                slug
            }
            error {
                code
                message
            }
        }
    }
`;

const DELETE_MODEL = /* GraphQL */ `
    mutation DeleteModel($modelId: ID!) {
        deleteContent: deleteContentModel(modelId: $modelId) {
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
            error {
                code
                message
            }
        }
    }
`;

/** Finds the model named `name`, or null. Names carry the run id, so at most one matches. */
export const findModelByName = async (
    session: ApiSession,
    name: string
): Promise<StoredModel | null> => {
    const result = await callGraphql<ListModelsData>(session, "cms/manage", LIST_MODELS);
    const listed = requireData(result, "listContentModels").listContentModels;
    if (!listed.data) {
        throw new Error(`listContentModels failed: ${listed.error?.message}`);
    }
    return listed.data.find(model => model.name === name) ?? null;
};

/** Finds the model group named `name`, or null. */
export const findGroupByName = async (
    session: ApiSession,
    name: string
): Promise<StoredGroup | null> => {
    const result = await callGraphql<ListGroupsData>(session, "cms/manage", LIST_GROUPS);
    const listed = requireData(result, "listContentModelGroups").listContentModelGroups;
    if (!listed.data) {
        throw new Error(`listContentModelGroups failed: ${listed.error?.message}`);
    }
    return listed.data.find(group => group.name === name) ?? null;
};

/** Deletes a model without entries. Returns the error message, or null when it is gone. */
export const deleteStoredModel = async (
    session: ApiSession,
    modelId: string
): Promise<string | null> => {
    const result = await callGraphql<DeleteData>(session, "cms/manage", DELETE_MODEL, { modelId });
    return result.errors?.[0]?.message ?? result.data?.deleteContent.error?.message ?? null;
};

/** Deletes a model group without models. Returns the error message, or null when it is gone. */
export const deleteStoredGroup = async (
    session: ApiSession,
    groupId: string
): Promise<string | null> => {
    const result = await callGraphql<DeleteData>(session, "cms/manage", DELETE_GROUP, {
        id: groupId
    });
    return result.errors?.[0]?.message ?? result.data?.deleteContent.error?.message ?? null;
};
