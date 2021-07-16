import dotProp from "dot-prop-immutable";
import orderBy from "lodash/orderBy";
import { CmsEditorContentEntry } from "~/types";
import * as GQL from "~/admin/graphql/contentEntries";

/*
 * We need to preserve the order of entries with new entry addition
 * because we're not re-fetching the list but updating it directly inside cache.
 * */
const sortEntries = (list, sort) => {
    if (!sort || typeof sort !== "string") {
        return list;
    }
    const [key, value] = sort.split("_");
    const order = value.toLowerCase() as "asc" | "desc";
    return orderBy(list, [key], [order]);
};

export const addEntryToListCache = (model, cache, entry: CmsEditorContentEntry, variables) => {
    const gqlParams = { query: GQL.createListQuery(model), variables };
    const { content } = cache.readQuery(gqlParams);
    if (!content || !content.data) {
        return;
    }
    cache.writeQuery({
        ...gqlParams,
        data: {
            content: {
                ...content,
                data: sortEntries([entry, ...content.data], variables.sort)
            }
        }
    });
};

export const updateLatestRevisionInListCache = (model, cache, revision, variables) => {
    const gqlParams = { query: GQL.createListQuery(model), variables };

    const [uniqueId] = revision.id.split("#");

    const { content } = cache.readQuery(gqlParams);
    if (!content || !content.data) {
        return;
    }
    const index = content.data.findIndex(item => item.id.startsWith(uniqueId));
    if (index === -1) {
        return;
    }

    cache.writeQuery({
        ...gqlParams,
        data: {
            content: dotProp.set(content, `data.${index}`, revision)
        }
    });
};

export const removeEntryFromListCache = (model, cache, revision, variables) => {
    // Delete the item from list cache
    const gqlParams = { query: GQL.createListQuery(model), variables };
    const { content } = cache.readQuery(gqlParams);
    if (!content || !content.data) {
        return;
    }
    const entryId = revision.id.split("#")[0];
    const index = content.data.findIndex(item => item.id.startsWith(entryId));
    if (index === -1) {
        return;
    }

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
    if (!revisions || !revisions.data) {
        return;
    }
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

    if (!revisions || !revisions.data) {
        return;
    }

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

    if (!revisions || !revisions.data) {
        return;
    }

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
