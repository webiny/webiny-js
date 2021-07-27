import dotProp from "dot-prop-immutable";
import orderBy from "lodash/orderBy";
import get from "lodash/get";
import { PbPageData } from "~/types";
import * as GQL from "~/admin/graphql/pages";

export const readPageListVariables = () => {
    let variables;

    try {
        variables = JSON.parse(localStorage.getItem("wby_pb_pages_list_latest_variables"));
    } catch {}

    return variables;
};

export const writePageListVariablesToLocalStorage = variables => {
    // Needs to be refactored. Possibly, with our own GQL client, this is going to be much easier to handle.
    localStorage.setItem("wby_pb_pages_list_latest_variables", JSON.stringify(variables));
};

/*
 * We need to preserve the order of entries with new entry addition
 * because we're not re-fetching the list but updating it directly inside cache.
 * */
const sortEntries = (list, sort) => {
    if (!sort || typeof sort !== "object") {
        return list;
    }
    const [key] = Object.keys(sort);
    const value = sort[key];
    const order = value.toLowerCase() as "asc" | "desc";
    return orderBy(list, [key], [order]);
};

export const addPageToListCache = (cache, page: PbPageData, variables) => {
    const gqlParams = { query: GQL.LIST_PAGES, variables };

    const data = cache.readQuery(gqlParams);
    const listPagesData = get(data, "pageBuilder.listPages.data");
    if (!listPagesData) {
        return;
    }

    cache.writeQuery({
        ...gqlParams,
        data: dotProp.set(
            data,
            "pageBuilder.listPages.data",
            sortEntries([page, ...listPagesData], variables.sort)
        )
    });
};

export const updateLatestRevisionInListCache = (cache, revision, variables) => {
    const gqlParams = { query: GQL.LIST_PAGES, variables };

    const data = cache.readQuery(gqlParams);

    const listPagesData = get(data, "pageBuilder.listPages.data");
    if (!listPagesData) {
        return;
    }

    const [uniqueId] = revision.id.split("#");
    const index = listPagesData.findIndex(item => item.id.startsWith(uniqueId));
    if (index === -1) {
        return;
    }

    cache.writeQuery({
        ...gqlParams,
        data: dotProp.set(data, `pageBuilder.listPages.data.${index}`, revision)
    });
};

export const removePageFromListCache = (cache, page, variables) => {
    // Delete the item from list cache
    const gqlParams = { query: GQL.LIST_PAGES, variables };

    const data = cache.readQuery(gqlParams);

    const listPagesData = get(data, "pageBuilder.listPages.data");
    if (!listPagesData) {
        return;
    }

    const [uniqueId] = page.id.split("#");
    const index = listPagesData.findIndex(item => item.id.startsWith(uniqueId));
    if (index === -1) {
        return;
    }

    cache.writeQuery({
        ...gqlParams,
        data: dotProp.delete(data, `pageBuilder.listPages.data.${index}`)
    });
};

export const removeRevisionFromEntryCache = (cache, revision) => {
    const gqlParams = {
        query: GQL.GET_PAGE,
        variables: { id: revision.id }
    };

    const data = cache.readQuery(gqlParams);
    const revisions = get(data, "pageBuilder.getPage.data.revisions");
    if (!revisions) {
        return;
    }
    const index = revisions.findIndex(item => item.id === revision.id);
    const newRevisions = dotProp.delete(revisions, index);

    cache.writeQuery({
        ...gqlParams,
        data: dotProp.set(data, "pageBuilder.getPage.data.revisions", newRevisions)
    });

    // Return new revisions
    return newRevisions;
};
