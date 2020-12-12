import dotProp from "dot-prop-immutable";
import { GET_FORM, LIST_FORMS } from "../graphql";

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

/**
 * Remove form from the list cache
 */
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
        query: GET_FORM,
        variables: { id: form.id }
    };

    let { formBuilder } = cache.readQuery(gqlParams);
    const index = formBuilder.form.data.revisions.findIndex(item => item.id === revision.id);

    formBuilder = dotProp.delete(formBuilder, `form.data.revisions.${index}`);

    cache.writeQuery({
        ...gqlParams,
        data: {
            formBuilder
        }
    });

    // Return new revisions
    return formBuilder.form.data.revisions;
};
