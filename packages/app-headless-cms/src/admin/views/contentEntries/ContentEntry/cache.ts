import dotProp from "dot-prop-immutable";
import orderBy from "lodash/orderBy";
import {
    CmsContentEntry,
    CmsContentEntryRevision,
    CmsModel
} from "@webiny/app-headless-cms-common/types";
import {
    CmsEntriesListQueryResponse,
    CmsEntriesListQueryVariables,
    CmsEntriesListRevisionsQueryResponse,
    CmsEntriesListRevisionsQueryVariables,
    createListQuery,
    createRevisionsQuery
} from "@webiny/app-headless-cms-common";
import { parseIdentifier } from "@webiny/utils";
import { DataProxy } from "apollo-cache";
import pick from "lodash/pick";
import { getModelTitleFieldId } from "~/utils/getModelTitleFieldId";

/*
 * We need to preserve the order of entries with new entry addition
 * because we're not re-fetching the list but updating it directly inside cache.
 * */
const sortEntries = (list: CmsContentEntry[], sort?: string[] | null): CmsContentEntry[] => {
    if (!sort) {
        return list;
    } else if (Array.isArray(sort) === false) {
        console.warn("Sort is not an Array of strings.");
        return list;
    } else if (sort.length === 0) {
        return list;
    }
    const [sortBy] = sort;
    const [key, value] = sortBy.split("_");
    const order = value.toLowerCase() as "asc" | "desc";
    return orderBy(list, [key], [order]);
};

export const addEntryToListCache = (
    model: CmsModel,
    cache: DataProxy,
    entry: CmsContentEntry,
    variables: CmsEntriesListQueryVariables
): void => {
    const gqlParams = { query: createListQuery(model), variables };
    const response = cache.readQuery<CmsEntriesListQueryResponse, CmsEntriesListQueryVariables>(
        gqlParams
    );
    if (!response || !response.content || !response.content.data) {
        return;
    }
    const { content } = response;
    cache.writeQuery({
        ...gqlParams,
        data: {
            content: {
                ...content,
                data: sortEntries(
                    [
                        pick(entry, [
                            "id",
                            "entryId",
                            getModelTitleFieldId(model),
                            "createdOn",
                            "savedOn",
                            "modelId",
                            "createdBy",
                            "ownedBy",
                            "meta",
                            "__typename"
                        ]) as CmsContentEntry,
                        ...content.data
                    ],
                    variables.sort
                )
            }
        }
    });
};

export const updateLatestRevisionInListCache = (
    model: CmsModel,
    cache: DataProxy,
    revision: CmsContentEntryRevision,
    variables: CmsEntriesListQueryVariables
): void => {
    const gqlParams = { query: createListQuery(model), variables };

    const { id: uniqueId } = parseIdentifier(revision.id);

    const response = cache.readQuery<CmsEntriesListQueryResponse, CmsEntriesListQueryVariables>(
        gqlParams
    );
    if (!response || !response.content || !response.content.data) {
        return;
    }
    const { content } = response;
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

export const removeEntryFromListCache = (
    model: CmsModel,
    cache: DataProxy,
    revision: Pick<CmsContentEntryRevision, "id">,
    variables: CmsEntriesListQueryVariables
): void => {
    // Delete the item from list cache
    const gqlParams = { query: createListQuery(model), variables };
    const response = cache.readQuery<CmsEntriesListQueryResponse, CmsEntriesListQueryVariables>(
        gqlParams
    );
    if (!response || !response.content || !response.content.data) {
        return;
    }
    const { content } = response;
    const { id: entryId } = parseIdentifier(revision.id);
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

export const removeRevisionFromEntryCache = (
    model: CmsModel,
    cache: DataProxy,
    revision: Pick<CmsContentEntryRevision, "id">
): CmsContentEntryRevision[] => {
    const { id } = parseIdentifier(revision.id);
    const gqlParams = {
        query: createRevisionsQuery(model),
        variables: {
            id
        }
    };

    const response = cache.readQuery<
        CmsEntriesListRevisionsQueryResponse,
        CmsEntriesListRevisionsQueryVariables
    >(gqlParams);
    if (
        !response ||
        !response.revisions ||
        !response.revisions.data ||
        response.revisions.data.length === 0
    ) {
        return [];
    }

    const { revisions } = response;

    const data = revisions.data.filter(item => {
        return item.id !== revision.id;
    });

    const query = {
        ...gqlParams,
        data: {
            revisions: {
                ...revisions,
                data
            }
        }
    };

    cache.writeQuery(query);

    return data;
};

export const addRevisionToRevisionsCache = (
    model: CmsModel,
    cache: DataProxy,
    revision: CmsContentEntryRevision
): void => {
    const { id } = parseIdentifier(revision.id);
    const gqlParams = {
        query: createRevisionsQuery(model),
        variables: {
            id
        }
    };

    const response = cache.readQuery<
        CmsEntriesListRevisionsQueryResponse,
        CmsEntriesListRevisionsQueryVariables
    >(gqlParams);

    if (!response || !response.revisions || !response.revisions.data) {
        return;
    }
    const { revisions } = response;

    cache.writeQuery({
        ...gqlParams,
        data: {
            revisions: dotProp.set(revisions, `data`, [revision, ...revisions.data])
        }
    });
};

export const unpublishPreviouslyPublishedRevision = (
    model: CmsModel,
    cache: DataProxy,
    publishedId: string
): void => {
    const { id } = parseIdentifier(publishedId);
    const gqlParams = {
        query: createRevisionsQuery(model),
        variables: {
            id
        }
    };

    const response = cache.readQuery<
        CmsEntriesListRevisionsQueryResponse,
        CmsEntriesListRevisionsQueryVariables
    >(gqlParams);

    if (!response?.revisions?.data) {
        return;
    }
    const { revisions } = response;

    const prevPublished = revisions.data.find(
        item => item.id !== publishedId && item.meta.status === "published"
    );

    if (!prevPublished) {
        return;
    }

    const query: DataProxy.WriteQueryOptions<
        CmsEntriesListRevisionsQueryResponse,
        CmsEntriesListRevisionsQueryVariables
    > = {
        ...gqlParams,
        data: {
            revisions: {
                ...revisions,
                data: revisions.data.map(revision => {
                    if (revision.id !== prevPublished.id) {
                        return {
                            ...revision
                        };
                    }
                    return {
                        ...revision,
                        meta: {
                            ...revision.meta,
                            status: "unpublished"
                        }
                    };
                })
            }
        }
    };

    cache.writeQuery(query);
};
