import { LIST_ENVIRONMENTS } from "@webiny/app-headless-cms/admin/views/Environments/graphql";
import { LIST_ENVIRONMENT_ALIASES } from "@webiny/app-headless-cms/admin/views/EnvironmentAliases/graphql";
import { cloneDeep, get, pick } from "lodash";

export const updateCacheAfterCreate = (cache, updated) => {
    const error = get(updated, "data.cms.environmentAlias.error");
    const updatedData = get(updated, "data.cms.environmentAlias.data");

    if (error) {
        // If the updated result has error, we return immediately
        return;
    }

    const gqlParams = {
        query: LIST_ENVIRONMENTS,
        variables: { sort: { savedOn: -1 } }
    };

    const environmentListAliasParams = {
        query: LIST_ENVIRONMENT_ALIASES
    };

    let data: any;
    const aliases = cloneDeep(cache.readQuery(environmentListAliasParams));

    const slug = updatedData.slug;
    aliases.cms.environmentAliases.data = [
        ...aliases.cms.environmentAliases.data,
        {
            ...updatedData,
            createdOn: Date.now(),
            url: {
                manage: `/cms/manage/${slug}`,
                preview: `/cms/preview/${slug}`,
                read: `/cms/read/${slug}`,
                __typename: "CmsEnvironmentAliasUrl"
            }
        }
    ];

    cache.writeQuery({
        ...environmentListAliasParams,
        data: aliases
    });

    try {
        data = cloneDeep(cache.readQuery(gqlParams));
    } catch (error) {
        // If the entry for `gqlParams` doesn't exist in cache, we return immediately.
        return;
    }

    // Update the cms environments data
    data.cms.environments.data = data.cms.environments.data.map(item => {
        if (item.id !== updatedData.environment.id) {
            return item;
        }
        return {
            ...item,
            environmentAliases: [
                ...item.environmentAliases,
                pick(updatedData, ["id", "name", "__typename"])
            ]
        };
    });

    cache.writeQuery({
        ...gqlParams,
        data
    });
};
