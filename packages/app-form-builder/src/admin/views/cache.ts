import dotProp from "dot-prop-immutable";
import { GET_FORM_REVISIONS, LIST_FORMS } from "../graphql";

// Replace existing "latest" revision with the new revision
export const updateLatestRevisionInListCache = (cache, revision) => {
    const gqlParams = { query: LIST_FORMS };

    const [uniqueId] = revision.id.split("#");

    const { formBuilder } = cache.readQuery(gqlParams);
    const index = formBuilder.listForms.data.findIndex(item => item.id.startsWith(uniqueId));

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder: dotProp.set(formBuilder, `listForms.data.${index}`, revision)
        }
    });
};

export const addFormToListCache = (cache, revision) => {
    const gqlParams = { query: LIST_FORMS };

    const { formBuilder } = cache.readQuery(gqlParams);
    
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

export const addRevisionToRevisionsCache = (cache, newRevision) => {
    const gqlParams = {
        query: GET_FORM_REVISIONS,
        variables: { id: newRevision.id.split("#")[0] }
    };

    const { formBuilder } = cache.readQuery(gqlParams);

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

export const removeFormFromListCache = (cache, form) => {
    // Delete the form from list cache
    const gqlParams = { query: LIST_FORMS };
    const { formBuilder } = cache.readQuery(gqlParams);
    const index = formBuilder.listForms.data.findIndex(item => item.id === form.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder: dotProp.delete(formBuilder, `listForms.data.${index}`)
        }
    });
};

export const removeRevisionFromFormCache = (cache, form, revision) => {
    const gqlParams = {
        query: GET_FORM_REVISIONS,
        variables: { id: form.id.split("#")[0] }
    };

    let { formBuilder } = cache.readQuery(gqlParams);
    const index = formBuilder.revisions.data.findIndex(item => item.id === revision.id);

    formBuilder = dotProp.delete(formBuilder, `revisions.data.${index}`);

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder
        }
    });

    // Return new revisions
    return formBuilder.revisions.data;
};
