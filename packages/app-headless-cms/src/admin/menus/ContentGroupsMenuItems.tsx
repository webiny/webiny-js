import React from "react";
import type { ListMenuCmsGroupsQueryResponse } from "~/admin/viewsGraphql.js";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql.js";
import useQuery from "~/admin/hooks/useQuery.js";
import { GroupMenu } from "./GroupMenu.js";
import { HasContentEntryPermissions } from "./HasContentEntryPermissions.js";
import { GroupContentModels } from "./GroupContentModels.js";

export const ContentGroupsMenuItems = () => {
    const response = useQuery<ListMenuCmsGroupsQueryResponse>(LIST_MENU_CONTENT_GROUPS_MODELS);
    const groups = response.data?.listContentModelGroups?.data;

    if (!groups || groups.length === 0) {
        return null;
    }

    return (
        <>
            {groups.map(group => (
                <HasContentEntryPermissions key={group.id} group={group}>
                    <>
                        <GroupMenu group={group} />
                        <GroupContentModels group={group} />
                    </>
                </HasContentEntryPermissions>
            ))}
        </>
    );
};
