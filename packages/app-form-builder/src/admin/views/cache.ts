import dotProp from "dot-prop-immutable";
import {
    GET_FORM_REVISIONS,
    GetFormRevisionsQueryResponse,
    GetFormRevisionsQueryVariables,
    LIST_FORMS,
    ListFormsQueryResponse
} from "../graphql";
import { DataProxy } from "apollo-cache";
import { FbFormModel, FbRevisionModel } from "~/types";

// Replace existing "latest" revision with the new revision
export const updateLatestRevisionInListCache = (
    cache: DataProxy,
    revision: FbRevisionModel
): void => {
    const gqlParams = { query: LIST_FORMS };

    const [uniqueId] = revision.id.split("#");

    const { formBuilder } = cache.readQuery<ListFormsQueryResponse>(gqlParams);
    const index = formBuilder.listForms.data.findIndex(item => item.id.startsWith(uniqueId));

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder: dotProp.set(formBuilder, `listForms.data.${index}`, revision)
        }
    });
};

export const addFormToListCache = (cache: DataProxy, revision: FbRevisionModel): void => {
    const gqlParams = { query: LIST_FORMS };

    const { formBuilder } = cache.readQuery<ListFormsQueryResponse>(gqlParams);

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder: dotProp.set(formBuilder, `listForms.data`, [
                revision,
                ...formBuilder.listForms.data
            ])
        }
    });
};

export const addRevisionToRevisionsCache = (
    cache: DataProxy,
    newRevision: FbRevisionModel
): void => {
    const gqlParams = {
        query: GET_FORM_REVISIONS,
        variables: { id: newRevision.id.split("#")[0] }
    };

    const { formBuilder } = cache.readQuery<
        GetFormRevisionsQueryResponse,
        GetFormRevisionsQueryVariables
    >(gqlParams);

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder: dotProp.set(formBuilder, `revisions.data`, [
                newRevision,
                ...formBuilder.revisions.data
            ])
        }
    });
};

export const removeFormFromListCache = (cache: DataProxy, form: FbFormModel): void => {
    // Delete the form from list cache
    const gqlParams = { query: LIST_FORMS };
    const { formBuilder } = cache.readQuery<ListFormsQueryResponse>(gqlParams);
    const index = formBuilder.listForms.data.findIndex(item => item.id === form.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder: dotProp.delete(formBuilder, `listForms.data.${index}`)
        }
    });
};

export const removeRevisionFromFormCache = (
    cache: DataProxy,
    form: FbRevisionModel,
    revision: FbRevisionModel
): FbRevisionModel[] => {
    const gqlParams = {
        query: GET_FORM_REVISIONS,
        variables: { id: form.id.split("#")[0] }
    };

    let { formBuilder } = cache.readQuery<
        GetFormRevisionsQueryResponse,
        GetFormRevisionsQueryVariables
    >(gqlParams);
    const index = formBuilder.revisions.data.findIndex(item => item.id === revision.id);

    formBuilder = dotProp.delete(
        formBuilder,
        `revisions.data.${index}`
    ) as GetFormRevisionsQueryResponse["formBuilder"];

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder
        }
    });

    // Return new revisions
    return formBuilder.revisions.data;
};
