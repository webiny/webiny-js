import dotProp from "dot-prop-immutable";
import { CmsEditorContentEntry } from "@webiny/app-headless-cms/types";
import * as GQL from "../../views/components/ContentModelForm/graphql";

export const addEntryToListCache = (model, cache, entry: CmsEditorContentEntry) => {
    const gqlParams = { query: GQL.createListQuery(model) };
    const { content } = cache.readQuery(gqlParams);

    cache.writeQuery({
        ...gqlParams,
        data: {
            content: {
                ...content,
                data: [entry, ...content.data]
            }
        }
    });
};

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
    const entryId = revision.id.split("#")[0];
    const index = content.data.findIndex(item => item.id.startsWith(entryId));

    cache.writeQuery({
        ...gqlParams,
        data: {
            content: dotProp.delete(content, `data.${index}`)
        }
    });
};

export const removeRevisionFromEntryCache = (model, cache, revision) => {
    const gqlParams = {
        query: GQL.createRevisionsQuery(model),
        variables: { id: revision.id.split("#")[0] }
    };

    const { revisions } = cache.readQuery(gqlParams);
    const index = revisions.data.findIndex(item => item.id === revision.id);
    const newRevisions = dotProp.delete(revisions, `data.${index}`);

    cache.writeQuery({
        ...gqlParams,
        data: {
            revisions: newRevisions
        }
    });

    // Return new revisions
    return newRevisions.data;
};

export const addRevisionToRevisionsCache = (model, cache, revision) => {
    const gqlParams = {
        query: GQL.createRevisionsQuery(model),
        variables: { id: revision.id.split("#")[0] }
    };

    const { revisions } = cache.readQuery(gqlParams);

    cache.writeQuery({
        ...gqlParams,
        data: {
            revisions: dotProp.set(revisions, `data`, [revision, ...revisions.data])
        }
    });
};

export const unpublishPreviouslyPublishedRevision = (model, cache, publishedId) => {
    const gqlParams = {
        query: GQL.createRevisionsQuery(model),
        variables: { id: publishedId.split("#")[0] }
    };

    const { revisions } = cache.readQuery(gqlParams);

    const prevPublished = revisions.data.findIndex(
        item => item.id !== publishedId && item.meta.status === "published"
    );

    if (prevPublished === -1) {
        return;
    }

    cache.writeQuery({
        ...gqlParams,
        data: {
            revisions: dotProp.set(revisions, `data.${prevPublished}.meta.status`, "unpublished")
        }
    });
};
