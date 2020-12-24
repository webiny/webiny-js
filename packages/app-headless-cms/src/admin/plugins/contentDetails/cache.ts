import dotProp from "dot-prop-immutable";
import * as GQL from "../../views/components/ContentModelForm/graphql";

export const updateLatestRevisionInListCache = (model, cache, revision) => {
    const gqlParams = { query: GQL.createListQuery(model) };

    const [uniqueId] = revision.id.split("#");

    const { content } = cache.readQuery(gqlParams);
    const index = content.data.findIndex(item => item.id.startsWith(uniqueId));

    cache.writeQuery({
        ...gqlParams,
        data: {
            content: dotProp.set(content, `data.${index}`, revision)
        }
    });
};

export const removeEntryFromListCache = (model, cache, revision) => {
    // Delete the item from list cache
    const gqlParams = { query: GQL.createListQuery(model) };
    const { content } = cache.readQuery(gqlParams);
    const index = content.data.findIndex(item => item.id === revision.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            content: dotProp.delete(content, `data.${index}`)
        }
    });
};

export const removeRevisionFromEntryCache = (model, cache, entry, revision) => {
    const gqlParams = {
        query: GQL.createReadQuery(model),
        variables: { revision: entry.id }
    };

    const { content } = cache.readQuery(gqlParams);
    const index = content.data.meta.revisions.findIndex(item => item.id === revision.id);
    const newContent = dotProp.delete(content, `data.meta.revisions.${index}`);
    
    cache.writeQuery({
        ...gqlParams,
        data: {
            content: newContent
        }
    });

    // Return new revisions
    return newContent.data.meta.revisions;
};
